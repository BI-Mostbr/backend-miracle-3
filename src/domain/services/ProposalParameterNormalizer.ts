import { CreditProposal } from '@domain/entities'

export type PropertyType = 'Residencial' | 'Comercial'

export interface CreditProposalWithPropertyType extends CreditProposal {
  propertyType: PropertyType
}

export interface BankProposalNormalizationRules {
  bankName: string
  ltvLimits: {
    Residencial: { max: number }
    Comercial: { max: number }
  }
  termLimits: {
    Residencial: { min: number; max: number }
    Comercial: { min: number; max: number }
  }
  minimumPropertyValue: number
  maximumPropertyValue?: number
}

export interface NormalizedProposal {
  originalProposal: CreditProposalWithPropertyType
  normalizedProposal: CreditProposal
  adjustments: ProposalAdjustment[]
  canProceed: boolean
  rejectionReasons: string[]
}

export interface ProposalAdjustment {
  fieldName: string
  originalValue: any
  adjustedValue: any
  adjustmentReason: string
  adjustmentType: 'automatic' | 'rejection'
}

export class BankProposalNormalizer {
  private static readonly BANK_RULES: Record<
    string,
    BankProposalNormalizationRules
  > = {
    inter: {
      bankName: 'inter',
      ltvLimits: {
        Residencial: { max: 75 },
        Comercial: { max: 60 }
      },
      termLimits: {
        Residencial: { min: 24, max: 360 },
        Comercial: { min: 24, max: 360 }
      },
      minimumPropertyValue: 200000
    },
    itau: {
      bankName: 'itau',
      ltvLimits: {
        Residencial: { max: 80 },
        Comercial: { max: 70 }
      },
      termLimits: {
        Residencial: { min: 60, max: 420 },
        Comercial: { min: 60, max: 240 }
      },
      minimumPropertyValue: 0
    },
    santander: {
      bankName: 'santander',
      ltvLimits: {
        Residencial: { max: 80 },
        Comercial: { max: 70 }
      },
      termLimits: {
        Residencial: { min: 60, max: 420 },
        Comercial: { min: 60, max: 240 }
      },
      minimumPropertyValue: 0
    }
  }

  private static validateGeneralRules(
    proposal: CreditProposalWithPropertyType
  ): string[] {
    const errors: string[] = []

    const propertyValue = this.parseMoneyValue(proposal.propertyValue)
    const financedValue = this.parseMoneyValue(proposal.financedValue)
    const term = parseInt(proposal.term)

    if (propertyValue <= 0) {
      errors.push('Valor do imóvel deve ser maior que zero')
    }

    if (financedValue <= 0) {
      errors.push('Valor do financiamento deve ser maior que zero')
    }

    if (term <= 0) {
      errors.push('Prazo deve ser maior que zero')
    }

    if (financedValue > propertyValue) {
      errors.push(
        'Valor do financiamento não pode ser maior que o valor do imóvel'
      )
    }

    if (term > 420) {
      errors.push('Prazo não pode ser maior que 420 meses')
    }

    return errors
  }

  static normalizeProposalForBank(
    proposal: CreditProposalWithPropertyType,
    bankName: string
  ): NormalizedProposal {
    const bankKey = bankName.toLowerCase()
    const bankRules = this.getBankRules(bankKey)
    const generalErrors = this.validateGeneralRules(proposal)
    if (generalErrors.length > 0) {
      return {
        originalProposal: proposal,
        normalizedProposal: { ...proposal },
        adjustments: [],
        canProceed: false,
        rejectionReasons: generalErrors
      }
    }

    const normalizedProposal: CreditProposal = { ...proposal }
    const adjustments: ProposalAdjustment[] = []
    const rejectionReasons: string[] = []

    this.applyPropertyValueValidation(
      normalizedProposal,
      proposal,
      bankRules,
      rejectionReasons
    )
    this.applyLtvAdjustment(
      normalizedProposal,
      proposal,
      bankRules,
      adjustments
    )
    this.applyTermAdjustment(
      normalizedProposal,
      proposal,
      bankRules,
      adjustments
    )

    return {
      originalProposal: proposal,
      normalizedProposal,
      adjustments,
      canProceed: rejectionReasons.length === 0,
      rejectionReasons
    }
  }

  static normalizeProposalForAllBanks(
    proposal: CreditProposalWithPropertyType
  ): Record<string, NormalizedProposal> {
    const normalizationResults: Record<string, NormalizedProposal> = {}

    for (const bankKey of Object.keys(this.BANK_RULES)) {
      try {
        normalizationResults[bankKey] = this.normalizeProposalForBank(
          proposal,
          bankKey
        )
      } catch (error) {
        console.warn(`Failed to normalize proposal for bank: ${bankKey}`, error)
      }
    }

    return normalizationResults
  }

  static proposalRequiresAdjustment(
    proposal: CreditProposalWithPropertyType,
    bankName: string
  ): boolean {
    const normalizationResult = this.normalizeProposalForBank(
      proposal,
      bankName
    )
    return (
      normalizationResult.adjustments.length > 0 ||
      !normalizationResult.canProceed
    )
  }

  static getAllBankNormalizationRules(): Record<
    string,
    BankProposalNormalizationRules
  > {
    return { ...this.BANK_RULES }
  }

  private static getBankRules(bankKey: string): BankProposalNormalizationRules {
    const bankRules = this.BANK_RULES[bankKey]
    if (!bankRules) {
      throw new Error(`Bank normalization rules not found for: ${bankKey}`)
    }
    return bankRules
  }

  private static applyPropertyValueValidation(
    normalizedProposal: CreditProposal,
    originalProposal: CreditProposalWithPropertyType,
    bankRules: BankProposalNormalizationRules,
    rejectionReasons: string[]
  ): void {
    const propertyValue = this.parseMoneyValue(originalProposal.propertyValue)

    if (propertyValue < bankRules.minimumPropertyValue) {
      rejectionReasons.push(
        `${bankRules.bankName} não aceita imóveis com valor inferior a R$ ${bankRules.minimumPropertyValue.toLocaleString()}`
      )
    }
  }

  private static applyLtvAdjustment(
    normalizedProposal: CreditProposal,
    originalProposal: CreditProposalWithPropertyType,
    bankRules: BankProposalNormalizationRules,
    adjustments: ProposalAdjustment[]
  ): void {
    const propertyValue = this.parseMoneyValue(originalProposal.propertyValue)
    const financedValue = this.parseMoneyValue(originalProposal.financedValue)
    const currentLtv = (financedValue / propertyValue) * 100
    const normalizedPropertyType = this.normalizePropertyTypeInternal(
      originalProposal.propertyType
    )
    const maxLtv = bankRules.ltvLimits[normalizedPropertyType].max

    if (currentLtv > maxLtv) {
      const newFinancedValue = (propertyValue * maxLtv) / 100
      const formattedNewValue = this.formatMoneyValue(newFinancedValue)

      normalizedProposal.financedValue = formattedNewValue

      adjustments.push({
        fieldName: 'financedValue',
        originalValue: originalProposal.financedValue,
        adjustedValue: formattedNewValue,
        adjustmentReason: `${bankRules.bankName} permite LTV máximo de ${maxLtv}% para imóveis ${normalizedPropertyType.toLowerCase()}. Valor ajustado de R$ ${financedValue.toLocaleString()} para R$ ${newFinancedValue.toLocaleString()}`,
        adjustmentType: 'automatic'
      })
    }
  }

  private static applyTermAdjustment(
    normalizedProposal: CreditProposal,
    originalProposal: CreditProposalWithPropertyType,
    bankRules: BankProposalNormalizationRules,
    adjustments: ProposalAdjustment[]
  ): void {
    const currentTerm = parseInt(originalProposal.term)
    const normalizedPropertyType = this.normalizePropertyTypeInternal(
      originalProposal.propertyType
    )
    const termLimits = bankRules.termLimits[normalizedPropertyType]

    let newTerm = currentTerm
    let wasAdjusted = false

    if (currentTerm < termLimits.min) {
      newTerm = termLimits.min
      wasAdjusted = true
    } else if (currentTerm > termLimits.max) {
      newTerm = termLimits.max
      wasAdjusted = true
    }
    if (wasAdjusted) {
      normalizedProposal.term = newTerm.toString()

      adjustments.push({
        fieldName: 'term',
        originalValue: originalProposal.term,
        adjustedValue: newTerm.toString(),
        adjustmentReason: `${bankRules.bankName} aceita prazo entre ${termLimits.min} e ${termLimits.max} meses para imóveis ${normalizedPropertyType.toLowerCase()}. Prazo ajustado de ${currentTerm} para ${newTerm} meses`,
        adjustmentType: 'automatic'
      })
    }
  }

  private static parseMoneyValue(value: string): number {
    if (!value) return 0
    return (
      parseFloat(
        value
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0
    )
  }

  private static formatMoneyValue(value: number): string {
    return value
      .toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      })
      .replace('R$', '')
      .trim()
  }

  static normalizePropertyType(propertyType: string): PropertyType {
    const normalized = propertyType.toLowerCase()
    if (normalized === 'residencial' || normalized === 'residential') {
      return 'Residencial'
    }
    if (normalized === 'comercial' || normalized === 'commercial') {
      return 'Comercial'
    }

    return (propertyType.charAt(0).toUpperCase() +
      propertyType.slice(1).toLowerCase()) as PropertyType
  }

  private static normalizePropertyTypeInternal(
    propertyType: string
  ): PropertyType {
    return this.normalizePropertyType(propertyType)
  }
}
