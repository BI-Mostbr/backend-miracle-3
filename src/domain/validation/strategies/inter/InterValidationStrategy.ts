import { CreditProposal } from '@domain/entities'
import { BaseBankValidationStrategy } from '../base/BaseBankValidationStrategy'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import {
  BankLimits,
  ValidationResult
} from '@infra/interfaces/IBankValidationStrategy.interface'

export class InterValidationStrategy extends BaseBankValidationStrategy {
  public readonly bankName = 'Inter'

  public readonly limits: BankLimits = {
    ltv: {
      min: 0,
      max: 75, // Residencial: máximo 75%
      propertyTypes: ['residencial', 'casa', 'apartamento']
    },
    term: {
      min: 24, // Mínimo 24 meses
      max: 360 // Máximo 360 meses
    },
    propertyValue: {
      min: 200000, // Mínimo R$ 200.000 (BLOQUEIA se menor)
      max: undefined
    },
    income: {
      min: 1000,
      multiplier: 5
    }
  }

  // ========== OVERRIDE DAS VALIDAÇÕES BASE ==========

  protected validateLTV(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log(
      '🐛 DEBUG: validateLTV() da base foi chamada, mas não fará nada'
    )
    // ⚠️ NÃO FAZER NADA - Nossa validação customizada cuida disso
  }

  protected validateTerm(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log(
      '🐛 DEBUG: validateTerm() da base foi chamada, mas não fará nada'
    )
    // ⚠️ NÃO FAZER NADA - Nossa validação customizada cuida disso
  }

  protected validateCustomRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log('🔍 Aplicando regras essenciais do Inter...')
    console.log('🔍 Aplicando regras essenciais do Inter...')

    // ===== DEBUG DA CONVERSÃO =====
    console.log(
      `🐛 DEBUG: proposal.propertyValue RAW: "${proposal.propertyValue}"`
    )
    console.log(
      `🐛 DEBUG: proposal.financedValue RAW: "${proposal.financedValue}"`
    )

    // Testar passo a passo o que está acontecendo
    const propValue = proposal.propertyValue
    const step1 = propValue.replace(/[R$\s.,]/g, '')
    const step2 = step1.replace(',', '.')
    const step3 = parseFloat(step2)

    console.log(`🐛 DEBUG: Conversão passo a passo:`)
    console.log(`   Original: "${propValue}"`)
    console.log(`   Após replace 1: "${step1}"`)
    console.log(`   Após replace 2: "${step2}"`)
    console.log(`   Após parseFloat: ${step3}`)

    // Testando manualmente
    const correctValue = parseFloat(
      propValue.replace(/[R$\s.]/g, '').replace(',', '.')
    )
    console.log(`🐛 DEBUG: Conversão correta: ${correctValue}`)

    // Testar o método do mapper
    const mapperResult = CreditProposalMapper.getPropertyValueAsNumber(proposal)
    console.log(`🐛 DEBUG: Resultado do mapper: ${mapperResult}`)

    // Calcular valores para debug
    const propertyValue = mapperResult
    const financedValue =
      CreditProposalMapper.getFinancedValueAsNumber(proposal)
    const ltv = this.calculateLTV(proposal)
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    console.log(`🐛 DEBUG: Valores finais:`)
    console.log(`   propertyValue: ${propertyValue}`)
    console.log(`   financedValue: ${financedValue}`)
    console.log(`   LTV: ${ltv.toFixed(2)}%`)
    console.log(`   term: ${term} meses`)

    // // Calcular valores para debug
    // const propertyValue =
    //   CreditProposalMapper.getPropertyValueAsNumber(proposal)
    // const financedValue =
    //   CreditProposalMapper.getFinancedValueAsNumber(proposal)
    // const ltv = this.calculateLTV(proposal)
    // const term = CreditProposalMapper.getTermAsNumber(proposal)

    console.log(`🐛 DEBUG: Valores calculados:`)
    console.log(`   propertyValue: ${propertyValue}`)
    console.log(`   financedValue: ${financedValue}`)
    console.log(`   LTV: ${ltv.toFixed(2)}%`)
    console.log(`   term: ${term} meses`)

    // REGRA 1: Valor mínimo do imóvel (bloqueia se menor que 200k)
    this.validateMinimumPropertyValue(proposal, result)

    // REGRA 2: LTV por tipo de imóvel (NOSSA validação customizada)
    this.validateLTVByPropertyType(proposal, result)

    // REGRA 3: Prazo (NOSSA validação customizada)
    this.validateTermLimits(proposal, result)

    // DEBUG: Mostrar estado do result após nossas validações
    console.log(`🐛 DEBUG: Após validações customizadas:`)
    console.log(`   errors: ${result.errors.length}`)
    console.log(`   warnings: ${result.warnings.length}`)
    result.errors.forEach((error, index) => {
      console.log(
        `   error[${index}]: ${error.code} - severity: ${error.severity}`
      )
    })
  }

  protected adjustCustomFields(proposal: CreditProposal): void {
    console.log('🔧 Aplicando ajustes essenciais do Inter...')

    // AJUSTE 1: LTV automático se maior que limite
    this.adjustLTVByPropertyType(proposal)

    // AJUSTE 2: Prazo automático se maior que 360
    this.adjustMaxTerm(proposal)
  }

  protected canAdjustCustomField(
    proposal: CreditProposal,
    field: string
  ): boolean {
    // Só permite ajustar valor financiado e prazo
    return field === 'financedValue' || field === 'term'
  }

  // ========== REGRAS ESSENCIAIS DO INTER ==========

  private validateMinimumPropertyValue(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyValue =
      CreditProposalMapper.getPropertyValueAsNumber(proposal)

    console.log(
      `🐛 DEBUG: validateMinimumPropertyValue - valor: ${propertyValue}, mínimo: ${this.limits.propertyValue.min}`
    )

    if (propertyValue < this.limits.propertyValue.min) {
      console.log(
        `🐛 DEBUG: Valor do imóvel é menor que mínimo - adicionando erro BLOCKING`
      )
      result.errors.push({
        code: 'PROPERTY_VALUE_TOO_LOW',
        field: 'propertyValue',
        message: `Inter não aceita imóveis com valor inferior a R$ ${this.limits.propertyValue.min.toLocaleString()}. Valor informado: ${this.formatCurrency(propertyValue)}`,
        severity: 'blocking' // Esta regra BLOQUEIA, não ajusta
      })
    } else {
      console.log(`🐛 DEBUG: Valor do imóvel OK`)
    }
  }

  private validateLTVByPropertyType(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const ltv = this.calculateLTV(proposal)

    let maxLTV = 75 // Padrão residencial

    // Determinar limite por tipo
    if (propertyType.includes('comercial')) {
      maxLTV = 60 // Comercial: máximo 60%
    } else {
      maxLTV = 75 // Residencial: máximo 75%
    }

    console.log(
      `🐛 DEBUG: validateLTVByPropertyType - LTV: ${ltv.toFixed(2)}%, máximo: ${maxLTV}%`
    )

    if (ltv > maxLTV) {
      console.log(
        `🐛 DEBUG: LTV excede limite - adicionando erro com severity WARNING`
      )
      // Marcar como ERROR com severity 'warning' para poder ser ajustado
      result.errors.push({
        code: 'LTV_EXCEEDS_LIMIT',
        field: 'ltv',
        message: `Inter: LTV ${ltv.toFixed(2)}% excede limite de ${maxLTV}% para imóvel ${propertyType}`,
        severity: 'warning' // Permite ajuste
      })
    } else {
      console.log(`🐛 DEBUG: LTV OK`)
    }
  }

  private validateTermLimits(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    console.log(
      `🐛 DEBUG: validateTermLimits - prazo: ${term}, mín: ${this.limits.term.min}, máx: ${this.limits.term.max}`
    )

    if (term < this.limits.term.min) {
      console.log(
        `🐛 DEBUG: Prazo menor que mínimo - adicionando erro com severity WARNING`
      )
      result.errors.push({
        code: 'TERM_TOO_SHORT',
        field: 'term',
        message: `Inter: Prazo ${term} meses é menor que o mínimo de ${this.limits.term.min} meses`,
        severity: 'warning' // Permite ajuste
      })
    } else if (term > this.limits.term.max) {
      console.log(
        `🐛 DEBUG: Prazo maior que máximo - adicionando erro com severity WARNING`
      )
      result.errors.push({
        code: 'TERM_TOO_LONG',
        field: 'term',
        message: `Inter: Prazo ${term} meses excede máximo de ${this.limits.term.max} meses`,
        severity: 'warning' // Permite ajuste
      })
    } else {
      console.log(`🐛 DEBUG: Prazo OK`)
    }
  }

  private adjustLTVByPropertyType(proposal: CreditProposal): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const currentLTV = this.calculateLTV(proposal)

    let maxLTV = 75 // Padrão residencial

    if (propertyType.includes('comercial')) {
      maxLTV = 60
    }

    console.log(
      `🐛 DEBUG: adjustLTVByPropertyType - LTV atual: ${currentLTV.toFixed(2)}%, máximo: ${maxLTV}%`
    )

    if (currentLTV > maxLTV) {
      const propertyValue =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const newFinancedValue = (propertyValue * maxLTV) / 100

      console.log(`🐛 DEBUG: Ajustando LTV:`)
      console.log(`   Valor do imóvel: ${propertyValue}`)
      console.log(
        `   Valor financiado original: ${CreditProposalMapper.getFinancedValueAsNumber(proposal)}`
      )
      console.log(`   Novo valor financiado: ${newFinancedValue}`)

      proposal.financedValue = this.formatCurrency(newFinancedValue)

      console.log(
        `🔧 Inter: LTV ajustado de ${currentLTV.toFixed(2)}% para ${maxLTV}% (${propertyType})`
      )
      console.log(
        `   Valor financiado ajustado para: ${this.formatCurrency(newFinancedValue)}`
      )
      console.log(
        `🐛 DEBUG: proposal.financedValue após ajuste: ${proposal.financedValue}`
      )
    } else {
      console.log(`🐛 DEBUG: LTV não precisa de ajuste`)
    }
  }

  private adjustMaxTerm(proposal: CreditProposal): void {
    const currentTerm = CreditProposalMapper.getTermAsNumber(proposal)

    console.log(
      `🐛 DEBUG: adjustMaxTerm - prazo atual: ${currentTerm}, limites: ${this.limits.term.min}-${this.limits.term.max}`
    )

    if (currentTerm < this.limits.term.min) {
      proposal.term = this.limits.term.min.toString()
      console.log(
        `🔧 Inter: Prazo ajustado de ${currentTerm} para ${this.limits.term.min} meses (mínimo)`
      )
    } else if (currentTerm > this.limits.term.max) {
      proposal.term = this.limits.term.max.toString()
      console.log(
        `🔧 Inter: Prazo ajustado de ${currentTerm} para ${this.limits.term.max} meses (máximo)`
      )
    } else {
      console.log(`🐛 DEBUG: Prazo não precisa de ajuste`)
    }
  }
}

/*
Esta versão adiciona logs de debug para entender:
1. Se as validações customizadas estão sendo chamadas
2. Quais valores estão sendo calculados
3. Se os erros estão sendo adicionados corretamente
4. Se os ajustes estão sendo aplicados
5. Se o financedValue está sendo modificado na proposta

Substitua temporariamente o InterValidationStrategy por esta versão
e execute o teste novamente para ver os logs de debug.
*/
