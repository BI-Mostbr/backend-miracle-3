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
    // ⚠️ NÃO FAZER NADA - Nossa validação customizada cuida disso
    // Isso evita a dupla validação que estava causando o problema
  }

  protected validateTerm(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // ⚠️ NÃO FAZER NADA - Nossa validação customizada cuida disso
    // Isso evita a dupla validação que estava causando o problema
  }

  protected validateCustomRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log('🔍 Aplicando regras essenciais do Inter...')

    // REGRA 1: Valor mínimo do imóvel (bloqueia se menor que 200k)
    this.validateMinimumPropertyValue(proposal, result)

    // REGRA 2: LTV por tipo de imóvel (NOSSA validação customizada)
    this.validateLTVByPropertyType(proposal, result)

    // REGRA 3: Prazo (NOSSA validação customizada)
    this.validateTermLimits(proposal, result)
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

    if (propertyValue < this.limits.propertyValue.min) {
      result.errors.push({
        code: 'PROPERTY_VALUE_TOO_LOW',
        field: 'propertyValue',
        message: `Inter não aceita imóveis com valor inferior a R$ ${this.limits.propertyValue.min.toLocaleString()}. Valor informado: ${this.formatCurrency(propertyValue)}`,
        severity: 'blocking' // Esta regra BLOQUEIA, não ajusta
      })
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

    if (ltv > maxLTV) {
      // Marcar como ERROR com severity 'warning' para poder ser ajustado
      result.errors.push({
        code: 'LTV_EXCEEDS_LIMIT',
        field: 'ltv',
        message: `Inter: LTV ${ltv.toFixed(2)}% excede limite de ${maxLTV}% para imóvel ${propertyType}`,
        severity: 'warning' // Permite ajuste
      })
    }
  }

  private validateTermLimits(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    if (term < this.limits.term.min) {
      result.errors.push({
        code: 'TERM_TOO_SHORT',
        field: 'term',
        message: `Inter: Prazo ${term} meses é menor que o mínimo de ${this.limits.term.min} meses`,
        severity: 'warning' // Permite ajuste
      })
    }

    if (term > this.limits.term.max) {
      result.errors.push({
        code: 'TERM_TOO_LONG',
        field: 'term',
        message: `Inter: Prazo ${term} meses excede máximo de ${this.limits.term.max} meses`,
        severity: 'warning' // Permite ajuste
      })
    }
  }

  private adjustLTVByPropertyType(proposal: CreditProposal): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const currentLTV = this.calculateLTV(proposal)

    let maxLTV = 75 // Padrão residencial

    if (propertyType.includes('comercial')) {
      maxLTV = 60
    }

    if (currentLTV > maxLTV) {
      const propertyValue =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const newFinancedValue = (propertyValue * maxLTV) / 100

      proposal.financedValue = this.formatCurrency(newFinancedValue)

      console.log(
        `🔧 Inter: LTV ajustado de ${currentLTV.toFixed(2)}% para ${maxLTV}% (${propertyType})`
      )
      console.log(
        `   Valor financiado ajustado para: ${this.formatCurrency(newFinancedValue)}`
      )
    }
  }

  private adjustMaxTerm(proposal: CreditProposal): void {
    const currentTerm = CreditProposalMapper.getTermAsNumber(proposal)

    if (currentTerm < this.limits.term.min) {
      proposal.term = this.limits.term.min.toString()
      console.log(
        `🔧 Inter: Prazo ajustado de ${currentTerm} para ${this.limits.term.min} meses (mínimo)`
      )
    }

    if (currentTerm > this.limits.term.max) {
      proposal.term = this.limits.term.max.toString()
      console.log(
        `🔧 Inter: Prazo ajustado de ${currentTerm} para ${this.limits.term.max} meses (máximo)`
      )
    }
  }
}
