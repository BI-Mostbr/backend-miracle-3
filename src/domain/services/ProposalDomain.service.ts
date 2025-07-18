import { CreditProposal } from '@domain/entities'
import {
  BankProposalNormalizer,
  CreditProposalWithPropertyType,
  NormalizedProposal
} from './ProposalParameterNormalizer'
export class ProposalDomainService {
  static validateBusinessRules(proposal: CreditProposal): boolean {
    if (!proposal.document || !proposal.name || !proposal.email) {
      console.error('Dados pessoais obrigatórios ausentes')
      return false
    }

    if (!proposal.propertyValue || !proposal.financedValue || !proposal.term) {
      console.error('Dados financeiros obrigatórios ausentes')
      return false
    }

    try {
      const propertyValue = this.parseMoneyValue(proposal.propertyValue)
      const financedValue = this.parseMoneyValue(proposal.financedValue)
      const term = parseInt(proposal.term)

      if (propertyValue <= 0 || financedValue <= 0 || term <= 0) {
        console.error('Valores devem ser positivos')
        return false
      }

      if (financedValue > propertyValue) {
        console.error('Valor financiado não pode ser maior que valor do imóvel')
        return false
      }

      const ltv = (financedValue / propertyValue) * 100
      if (ltv >= 100) {
        console.error('LTV não pode ser 100% ou maior')
        return false
      }

      if (term > 420) {
        console.error('Prazo não pode ser maior que 420 meses')
        return false
      }
    } catch (error) {
      console.error('Erro ao validar valores financeiros:', error)
      return false
    }

    if (!this.validateCPF(proposal.document)) {
      console.error('CPF inválido')
      return false
    }

    if (!this.validateEmail(proposal.email)) {
      console.error('Email inválido')
      return false
    }

    return true
  }

  static validateAndAdjustForBank(
    proposal: CreditProposal,
    bankName: string
  ): {
    success: boolean
    adjustedProposal?: CreditProposal
    errors: string[]
    adjustments: any[]
  } {
    if (!this.validateBusinessRules(proposal)) {
      console.error(`❌ ${bankName}: Falha nas regras básicas`)
      return {
        success: false,
        errors: ['Proposta não atende às regras básicas de negócio'],
        adjustments: []
      }
    }

    try {
      const proposalWithType: CreditProposalWithPropertyType = {
        ...proposal,
        propertyType: BankProposalNormalizer.normalizePropertyType(
          proposal.propertyType
        )
      }

      const normalizationResult =
        BankProposalNormalizer.normalizeProposalForBank(
          proposalWithType,
          bankName
        )

      if (normalizationResult.canProceed) {
        if (normalizationResult.adjustments.length > 0) {
          console.log(
            `${bankName}: Aplicando ${normalizationResult.adjustments.length} ajuste(s)`
          )
          normalizationResult.adjustments.forEach((adjustment) => {
            console.log(
              `${adjustment.fieldName}: ${adjustment.originalValue} → ${adjustment.adjustedValue}`
            )
            console.log(`Motivo: ${adjustment.adjustmentReason}`)
          })
        }

        console.log(
          `{bankName}: Proposta aprovada${normalizationResult.adjustments.length > 0 ? ' com ajustes' : ''}`
        )

        return {
          success: true,
          adjustedProposal: normalizationResult.normalizedProposal,
          errors: [],
          adjustments: normalizationResult.adjustments
        }
      } else {
        console.error(`${bankName}: Proposta rejeitada`)
        normalizationResult.rejectionReasons.forEach((reason) => {
          console.error(`${reason}`)
        })

        return {
          success: false,
          errors: normalizationResult.rejectionReasons,
          adjustments: normalizationResult.adjustments
        }
      }
    } catch (error) {
      console.error(`Erro na validação ${bankName}:`, error)
      return {
        success: false,
        errors: [`Erro interno na validação para ${bankName}`],
        adjustments: []
      }
    }
  }

  static validateAndAdjustForMultipleBanks(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    canProceed: boolean
    validBanks: string[]
    invalidBanks: string[]
    results: Record<string, NormalizedProposal>
    errors: string[]
    warnings: string[]
    summary: string
    adjustedProposals: Record<string, CreditProposal>
  } {
    if (!this.validateBusinessRules(proposal)) {
      return {
        canProceed: false,
        validBanks: [],
        invalidBanks: bankNames,
        results: {},
        errors: ['Proposta não atende às regras básicas de negócio'],
        warnings: [],
        summary: 'Proposta rejeitada: falha nas validações básicas',
        adjustedProposals: {}
      }
    }

    const proposalWithType: CreditProposalWithPropertyType = {
      ...proposal,
      propertyType: BankProposalNormalizer.normalizePropertyType(
        proposal.propertyType
      )
    }

    const results: Record<string, NormalizedProposal> = {}
    const validBanks: string[] = []
    const invalidBanks: string[] = []
    const errors: string[] = []
    const warnings: string[] = []
    const adjustedProposals: Record<string, CreditProposal> = {}

    bankNames.forEach((bankName) => {
      try {
        const result = BankProposalNormalizer.normalizeProposalForBank(
          proposalWithType,
          bankName
        )
        results[bankName] = result

        if (result.canProceed) {
          validBanks.push(bankName)
          adjustedProposals[bankName] = result.normalizedProposal

          if (result.adjustments.length > 0) {
            warnings.push(
              `${bankName}: ${result.adjustments.length} ajuste(s) aplicado(s)`
            )
          }
        } else {
          invalidBanks.push(bankName)
          result.rejectionReasons.forEach((reason) => {
            errors.push(`${bankName}: ${reason}`)
          })
        }
      } catch (error) {
        invalidBanks.push(bankName)
        errors.push(`${bankName}: Erro interno na validação`)
        console.error(`Erro ao validar ${bankName}:`, error)
      }
    })

    return {
      canProceed: validBanks.length > 0,
      validBanks,
      invalidBanks,
      results,
      errors,
      warnings,
      summary: `${validBanks.length}/${bankNames.length} banco(s) aprovaram a proposta`,
      adjustedProposals
    }
  }

  /**
   * Método legado - mantido para compatibilidade com código existente
   * @deprecated Use validateAndAdjustForBank instead
   */
  static validateForBank(proposal: CreditProposal, bankName: string): boolean {
    const result = this.validateAndAdjustForBank(proposal, bankName)

    if (result.success && result.adjustedProposal) {
      Object.assign(proposal, result.adjustedProposal)
    }

    return result.success
  }

  static checkRequiredAdjustments(
    proposal: CreditProposal,
    bankName: string
  ): { requiresAdjustment: boolean; adjustments: any[]; canProceed: boolean } {
    const proposalWithType: CreditProposalWithPropertyType = {
      ...proposal,
      propertyType: BankProposalNormalizer.normalizePropertyType(
        proposal.propertyType
      )
    }

    const result = BankProposalNormalizer.normalizeProposalForBank(
      proposalWithType,
      bankName
    )

    return {
      requiresAdjustment: result.adjustments.length > 0,
      adjustments: result.adjustments,
      canProceed: result.canProceed
    }
  }

  static checkRequiredAdjustmentsForAllBanks(
    proposal: CreditProposal
  ): Record<
    string,
    { requiresAdjustment: boolean; adjustments: any[]; canProceed: boolean }
  > {
    const proposalWithType: CreditProposalWithPropertyType = {
      ...proposal,
      propertyType: BankProposalNormalizer.normalizePropertyType(
        proposal.propertyType
      )
    }

    const allResults =
      BankProposalNormalizer.normalizeProposalForAllBanks(proposalWithType)
    const summary: Record<string, any> = {}

    Object.entries(allResults).forEach(([bankName, result]) => {
      summary[bankName] = {
        requiresAdjustment: result.adjustments.length > 0,
        adjustments: result.adjustments,
        canProceed: result.canProceed
      }
    })

    return summary
  }

  static getBankLimitsInfo(): Record<string, any> {
    return BankProposalNormalizer.getAllBankNormalizationRules()
  }

  static getAvailableBanks(): string[] {
    return Object.keys(BankProposalNormalizer.getAllBankNormalizationRules())
  }

  static isBankSupported(bankName: string): boolean {
    const rules = BankProposalNormalizer.getAllBankNormalizationRules()
    return Object.keys(rules).includes(bankName.toLowerCase())
  }

  static calculateLTV(proposal: CreditProposal): number {
    try {
      const propertyValue = this.parseMoneyValue(proposal.propertyValue)
      const financedValue = this.parseMoneyValue(proposal.financedValue)

      if (propertyValue === 0) return 0
      return (financedValue / propertyValue) * 100
    } catch {
      return 0
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

  static validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '')

    if (cleanCPF.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) digit = 0
    if (digit !== parseInt(cleanCPF.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) digit = 0
    if (digit !== parseInt(cleanCPF.charAt(10))) return false

    return true
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
