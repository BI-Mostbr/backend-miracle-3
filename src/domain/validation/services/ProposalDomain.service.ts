import { CreditProposal } from '@domain/entities'
import { ProposalValidationManager } from '../managers/ProposalValidation.manager'

export class ProposalDomainService {
  /**
   * Valida regras de negócio básicas da proposta
   */
  static validateBusinessRules(proposal: CreditProposal): boolean {
    console.log('🔍 Validando regras de negócio básicas...')

    // Validações obrigatórias básicas
    if (!proposal.document || !proposal.name || !proposal.email) {
      console.error('❌ Dados pessoais obrigatórios ausentes')
      return false
    }

    if (!proposal.propertyValue || !proposal.financedValue || !proposal.term) {
      console.error('❌ Dados financeiros obrigatórios ausentes')
      return false
    }

    // Validar se valores são numéricos válidos
    try {
      const propertyValue = this.parseMoneyValue(proposal.propertyValue)
      const financedValue = this.parseMoneyValue(proposal.financedValue)
      const term = parseInt(proposal.term)

      if (propertyValue <= 0 || financedValue <= 0 || term <= 0) {
        console.error('❌ Valores devem ser positivos')
        return false
      }

      if (financedValue > propertyValue) {
        console.error(
          '❌ Valor financiado não pode ser maior que valor do imóvel'
        )
        return false
      }

      // Validar LTV básico (não pode ser 100%)
      const ltv = (financedValue / propertyValue) * 100
      if (ltv >= 100) {
        console.error('❌ LTV não pode ser 100% ou maior')
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao validar valores financeiros:', error)
      return false
    }

    // Validar CPF básico
    if (!this.validateCPF(proposal.document)) {
      console.error('❌ CPF inválido')
      return false
    }

    // Validar email básico
    if (!this.validateEmail(proposal.email)) {
      console.error('❌ Email inválido')
      return false
    }

    console.log('✅ Regras básicas de negócio aprovadas')
    return true
  }

  /**
   * Valida e ajusta proposta para um banco específico
   * USADO PELO USE CASE EXISTENTE
   */
  static validateForBank(proposal: CreditProposal, bankName: string): boolean {
    console.log(`🔍 Validando proposta para ${bankName} (Strategy Pattern)...`)

    // 1. Validar regras básicas primeiro
    if (!this.validateBusinessRules(proposal)) {
      console.error(`❌ ${bankName}: Falha nas regras básicas`)
      return false
    }

    try {
      // 2. Aplicar Strategy Pattern para validação específica
      const result = ProposalValidationManager.validateForBank(
        proposal,
        bankName
      )

      if (result.isValid) {
        // 3. Se houveram ajustes, aplicar na proposta original
        if (result.adjustments.length > 0) {
          console.log(
            `🔧 ${bankName}: Aplicando ${result.adjustments.length} ajuste(s)`
          )
          this.applyAdjustments(proposal, result.adjustments)

          // Log dos ajustes aplicados
          result.adjustments.forEach((adjustment) => {
            console.log(
              `   📝 ${adjustment.field}: ${adjustment.originalValue} → ${adjustment.adjustedValue}`
            )
            console.log(`      Motivo: ${adjustment.reason}`)
          })
        }

        // Log warnings se houver
        if (result.warnings.length > 0) {
          console.log(`⚠️ ${bankName}: ${result.warnings.length} aviso(s)`)
          result.warnings.forEach((warning) => {
            console.log(`   ⚠️ ${warning.message}`)
          })
        }

        console.log(
          `✅ ${bankName}: Proposta aprovada${result.adjustments.length > 0 ? ' com ajustes' : ''}`
        )
        return true
      } else {
        // Log dos erros
        console.error(`❌ ${bankName}: Proposta rejeitada`)
        result.errors.forEach((error) => {
          console.error(`   🚫 ${error.message}`)
        })
        return false
      }
    } catch (error) {
      console.error(`❌ Erro na validação ${bankName}:`, error)
      return false
    }
  }

  /**
   * Valida múltiplos bancos e retorna resultado detalhado
   * NOVA FUNCIONALIDADE
   */
  static async validateForMultipleBanks(
    proposal: CreditProposal,
    bankNames: string[]
  ): Promise<{
    canProceed: boolean
    validBanks: string[]
    invalidBanks: string[]
    errors: string[]
    warnings: string[]
    summary: string
    adjustedProposals?: { [bankName: string]: CreditProposal }
  }> {
    console.log(`🔍 Validação múltipla para: ${bankNames.join(', ')}`)

    // 1. Validar regras básicas
    if (!this.validateBusinessRules(proposal)) {
      return {
        canProceed: false,
        validBanks: [],
        invalidBanks: bankNames,
        errors: ['Proposta não atende às regras básicas de negócio'],
        warnings: [],
        summary: 'Proposta rejeitada: falha nas validações básicas'
      }
    }

    // 2. Usar Strategy Pattern para validação múltipla
    const validation = ProposalValidationManager.validateForMultipleBanks(
      proposal,
      bankNames
    )

    // 3. Extrair dados para formato compatível com Use Case
    const errors: string[] = []
    const warnings: string[] = []

    Object.values(validation.bankResults).forEach((result) => {
      result.errors.forEach((error) => {
        errors.push(`${result.bankName}: ${error.message}`)
      })

      result.warnings.forEach((warning) => {
        warnings.push(`${result.bankName}: ${warning.message}`)
      })
    })

    console.log(
      `📊 Resultado: ${validation.validBanks.length}/${bankNames.length} banco(s) aprovado(s)`
    )

    return {
      canProceed: validation.success,
      validBanks: validation.validBanks,
      invalidBanks: validation.invalidBanks,
      errors,
      warnings,
      summary: `${validation.validBanks.length}/${bankNames.length} banco(s) aprovaram a proposta`,
      adjustedProposals: validation.adjustedProposals
    }
  }

  /**
   * Retorna informações sobre limites dos bancos
   */
  static getBankLimitsInfo(): { [bankName: string]: any } {
    return ProposalValidationManager.getAllBankInfo()
  }

  /**
   * Simula validação sem modificar proposta
   */
  static simulateValidation(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    wouldPass: { [bankName: string]: boolean }
    requiredAdjustments: { [bankName: string]: string[] }
    recommendations: string[]
  } {
    return ProposalValidationManager.simulateValidation(proposal, bankNames)
  }

  /**
   * Retorna melhor opção de banco
   */
  static getBestBankOption(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    bestBank?: string
    reason: string
    alternatives: string[]
  } {
    const result = ProposalValidationManager.getBestBankOption(
      proposal,
      bankNames
    )
    return {
      bestBank: result.bestBank,
      reason: result.reason,
      alternatives: result.alternatives
    }
  }

  /**
   * Gera relatório detalhado
   */
  static generateValidationReport(
    proposal: CreditProposal,
    bankNames: string[]
  ): any {
    return ProposalValidationManager.generateDetailedReport(proposal, bankNames)
  }

  // ========== MÉTODOS PRIVADOS DE APOIO ==========

  private static applyAdjustments(
    proposal: CreditProposal,
    adjustments: any[]
  ): void {
    adjustments.forEach((adjustment) => {
      switch (adjustment.field) {
        case 'financedValue':
          proposal.financedValue = adjustment.adjustedValue
          break
        case 'term':
          proposal.term = adjustment.adjustedValue.replace(/[^\d]/g, '') // Extrair apenas números
          break
        case 'propertyValue':
          proposal.propertyValue = adjustment.adjustedValue
          break
      }
    })
  }

  private static parseMoneyValue(value: string): number {
    if (!value) return 0
    return (
      parseFloat(
        value.replace(/[R$\s.,]/g, '').replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  // ========== VALIDAÇÕES BÁSICAS ==========

  static validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '')

    if (cleanCPF.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false // CPFs com todos os dígitos iguais

    // Validação dos dígitos verificadores
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

  // ========== MÉTODOS UTILITÁRIOS ==========

  static getAvailableBanks(): string[] {
    return ProposalValidationManager.getAvailableBanks()
  }

  static isBankSupported(bankName: string): boolean {
    return ProposalValidationManager.isBankAvailable(bankName)
  }

  static getValidationStatistics(): any {
    return ProposalValidationManager.getValidationStatistics()
  }
}
