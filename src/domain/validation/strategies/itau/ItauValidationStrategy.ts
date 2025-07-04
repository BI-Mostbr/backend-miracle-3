import { CreditProposal } from '@domain/entities'
import { BaseBankValidationStrategy } from '../base/BaseBankValidationStrategy'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import {
  BankLimits,
  ValidationResult
} from '@infra/interfaces/IBankValidationStrategy.interface'

export class ItauValidationStrategy extends BaseBankValidationStrategy {
  public readonly bankName = 'Itaú'

  public readonly limits: BankLimits = {
    ltv: {
      min: 0,
      max: 80, // Residencial: máximo 80%
      propertyTypes: ['residencial', 'casa', 'apartamento']
    },
    term: {
      min: 60, // Residencial: mínimo 60 meses
      max: 420 // Residencial: máximo 420 meses
    },
    propertyValue: {
      min: 50000, // Valor baixo, sem restrição específica mencionada
      max: undefined
    },
    income: {
      min: 1000,
      multiplier: 6
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
    console.log('🔍 Aplicando regras essenciais do Itaú...')

    // REGRA 1: LTV por tipo de imóvel (NOSSA validação customizada)
    this.validateLTVByPropertyType(proposal, result)

    // REGRA 2: Prazos por tipo de imóvel (NOSSA validação customizada)
    this.validateTermByPropertyType(proposal, result)
  }

  protected adjustCustomFields(proposal: CreditProposal): void {
    console.log('🔧 Aplicando ajustes essenciais do Itaú...')

    // AJUSTE 1: LTV automático se maior que limite
    this.adjustLTVByPropertyType(proposal)

    // AJUSTE 2: Prazo automático se fora dos limites
    this.adjustTermByPropertyType(proposal)
  }

  protected canAdjustCustomField(
    proposal: CreditProposal,
    field: string
  ): boolean {
    // Permite ajustar valor financiado e prazo
    return field === 'financedValue' || field === 'term'
  }

  // ========== REGRAS ESSENCIAIS DO ITAÚ ==========

  private validateLTVByPropertyType(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const ltv = this.calculateLTV(proposal)

    let maxLTV = 80 // Padrão residencial

    if (propertyType.includes('comercial')) {
      maxLTV = 70 // Comercial: máximo 70%
    } else {
      maxLTV = 80 // Residencial: máximo 80%
    }

    if (ltv > maxLTV) {
      // Marcar como ERROR com severity 'warning' para poder ser ajustado
      result.errors.push({
        code: 'LTV_EXCEEDS_LIMIT',
        field: 'ltv',
        message: `Itaú: LTV ${ltv.toFixed(2)}% excede limite de ${maxLTV}% para imóvel ${propertyType}`,
        severity: 'warning' // Permite ajuste
      })
    }
  }

  private validateTermByPropertyType(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    let minTerm = 60 // Residencial mínimo
    let maxTerm = 420 // Residencial máximo

    if (propertyType.includes('comercial')) {
      minTerm = 60 // Comercial mínimo (pode ajustar se necessário)
      maxTerm = 240 // Comercial máximo
    }

    if (term < minTerm) {
      // Marcar como ERROR com severity 'warning' para poder ser ajustado
      result.errors.push({
        code: 'TERM_TOO_SHORT',
        field: 'term',
        message: `Itaú: Prazo ${term} meses é menor que o mínimo de ${minTerm} meses para imóvel ${propertyType}`,
        severity: 'warning' // Permite ajuste
      })
    }

    if (term > maxTerm) {
      // Marcar como ERROR com severity 'warning' para poder ser ajustado
      result.errors.push({
        code: 'TERM_TOO_LONG',
        field: 'term',
        message: `Itaú: Prazo ${term} meses excede máximo de ${maxTerm} meses para imóvel ${propertyType}`,
        severity: 'warning' // Permite ajuste
      })
    }
  }

  private adjustLTVByPropertyType(proposal: CreditProposal): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const currentLTV = this.calculateLTV(proposal)

    let maxLTV = 80 // Padrão residencial

    if (propertyType.includes('comercial')) {
      maxLTV = 70
    }

    if (currentLTV > maxLTV) {
      const propertyValue =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const newFinancedValue = (propertyValue * maxLTV) / 100

      proposal.financedValue = this.formatCurrency(newFinancedValue)

      console.log(
        `🔧 Itaú: LTV ajustado de ${currentLTV.toFixed(2)}% para ${maxLTV}% (${propertyType})`
      )
      console.log(
        `   Valor financiado ajustado para: ${this.formatCurrency(newFinancedValue)}`
      )
    }
  }

  private adjustTermByPropertyType(proposal: CreditProposal): void {
    const propertyType = proposal.propertyType?.toLowerCase() || 'residencial'
    const currentTerm = CreditProposalMapper.getTermAsNumber(proposal)

    let minTerm = 60 // Residencial mínimo
    let maxTerm = 420 // Residencial máximo

    if (propertyType.includes('comercial')) {
      minTerm = 60 // Comercial mínimo
      maxTerm = 240 // Comercial máximo
    }

    // Ajustar se menor que mínimo
    if (currentTerm < minTerm) {
      proposal.term = minTerm.toString()
      console.log(
        `🔧 Itaú: Prazo ajustado de ${currentTerm} para ${minTerm} meses (mínimo para ${propertyType})`
      )
    }

    // Ajustar se maior que máximo
    if (currentTerm > maxTerm) {
      proposal.term = maxTerm.toString()
      console.log(
        `🔧 Itaú: Prazo ajustado de ${currentTerm} para ${maxTerm} meses (máximo para ${propertyType})`
      )
    }
  }
}
