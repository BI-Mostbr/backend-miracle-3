import { CreditProposal } from '@domain/entities'
import {
  BankLimits,
  IBankValidationStrategy,
  ValidationAdjustment,
  ValidationResult,
  ValidationWarning
} from '@infra/interfaces/IBankValidationStrategy.interface'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'

export abstract class BaseBankValidationStrategy
  implements IBankValidationStrategy
{
  public abstract readonly bankName: string
  public abstract readonly limits: BankLimits

  /**
   * Template method - implementação padrão que pode ser sobrescrita
   */
  validate(proposal: CreditProposal): ValidationResult {
    console.log(`🔍 Validando proposta para ${this.bankName}...`)

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      adjustments: [],
      bankName: this.bankName,
      originalProposal: this.extractRelevantFields(proposal)
    }

    // Executar validações na ordem
    this.validateBasicFields(proposal, result)
    this.validateLTV(proposal, result)
    this.validateTerm(proposal, result)
    this.validatePropertyValue(proposal, result)
    this.validateIncome(proposal, result)
    this.validateCustomRules(proposal, result)

    // Determinar se é válido (sem erros blocking)
    result.isValid = !result.errors.some(
      (error) => error.severity === 'blocking'
    )

    console.log(
      `${result.isValid ? '✅' : '❌'} Validação ${this.bankName}: ${result.isValid ? 'Aprovada' : 'Rejeitada'}`
    )

    return result
  }

  validateAndAdjust(proposal: CreditProposal): ValidationResult {
    // 1. Primeira validação
    let result = this.validate(proposal)

    if (result.isValid) {
      return result // Já está válida, não precisa ajustar
    }

    // 2. Tentar ajustar
    console.log(`🔧 Tentando ajustar proposta para ${this.bankName}...`)

    const adjustedProposal = this.adjustProposal(
      JSON.parse(JSON.stringify(proposal))
    )

    // 3. Validar novamente após ajustes
    result = this.validate(adjustedProposal)
    result.adjustedProposal = this.extractRelevantFields(adjustedProposal)

    // 4. Registrar ajustes realizados
    result.adjustments = this.calculateAdjustments(proposal, adjustedProposal)

    console.log(
      `🔧 ${result.adjustments.length} ajuste(s) aplicado(s) para ${this.bankName}`
    )

    return result
  }

  adjustProposal(proposal: CreditProposal): CreditProposal {
    console.log(`🔧 Aplicando ajustes automáticos para ${this.bankName}...`)

    // Aplicar ajustes na ordem de prioridade
    this.adjustLTV(proposal)
    this.adjustTerm(proposal)
    this.adjustCustomFields(proposal)

    return proposal
  }

  canAdjust(proposal: CreditProposal, field: string): boolean {
    switch (field) {
      case 'ltv':
        return this.canAdjustLTV(proposal)
      case 'term':
        return this.canAdjustTerm(proposal)
      default:
        return this.canAdjustCustomField(proposal, field)
    }
  }

  getSuggestions(proposal: CreditProposal): ValidationWarning[] {
    const suggestions: ValidationWarning[] = []

    // LTV suggestions
    const ltv = this.calculateLTV(proposal)
    if (ltv > this.limits.ltv.max) {
      const suggestedValue = this.calculateMaxFinancedValue(proposal)
      suggestions.push({
        code: 'LTV_TOO_HIGH',
        field: 'financedValue',
        message: `LTV atual (${ltv.toFixed(2)}%) excede o limite de ${this.limits.ltv.max}%`,
        recommendation: `Reduza o valor financiado para ${this.formatCurrency(suggestedValue)}`
      })
    }

    // Term suggestions
    const term = CreditProposalMapper.getTermAsNumber(proposal)
    if (term > this.limits.term.max) {
      suggestions.push({
        code: 'TERM_TOO_LONG',
        field: 'term',
        message: `Prazo atual (${term} meses) excede o limite de ${this.limits.term.max} meses`,
        recommendation: `Reduza o prazo para ${this.limits.term.max} meses`
      })
    }

    return suggestions
  }

  // ========== MÉTODOS PROTEGIDOS PARA OVERRIDE ==========

  protected validateBasicFields(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    if (!proposal.document || !proposal.name || !proposal.email) {
      result.errors.push({
        code: 'MISSING_BASIC_FIELDS',
        field: 'basic',
        message: 'Dados básicos obrigatórios ausentes',
        severity: 'blocking'
      })
    }

    if (!proposal.propertyValue || !proposal.financedValue || !proposal.term) {
      result.errors.push({
        code: 'MISSING_FINANCIAL_FIELDS',
        field: 'financial',
        message: 'Dados financeiros obrigatórios ausentes',
        severity: 'blocking'
      })
    }
  }

  protected validateLTV(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const ltv = this.calculateLTV(proposal)

    if (ltv > this.limits.ltv.max) {
      if (this.canAdjustLTV(proposal)) {
        result.warnings.push({
          code: 'LTV_WILL_BE_ADJUSTED',
          field: 'ltv',
          message: `LTV (${ltv.toFixed(2)}%) será ajustado para ${this.limits.ltv.max}%`
        })
      } else {
        result.errors.push({
          code: 'LTV_TOO_HIGH',
          field: 'ltv',
          message: `LTV (${ltv.toFixed(2)}%) excede o limite máximo de ${this.limits.ltv.max}%`,
          severity: 'blocking'
        })
      }
    }

    if (ltv < this.limits.ltv.min) {
      result.errors.push({
        code: 'LTV_TOO_LOW',
        field: 'ltv',
        message: `LTV (${ltv.toFixed(2)}%) é menor que o mínimo de ${this.limits.ltv.min}%`,
        severity: 'blocking'
      })
    }
  }

  protected validateTerm(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    if (term > this.limits.term.max) {
      if (this.canAdjustTerm(proposal)) {
        result.warnings.push({
          code: 'TERM_WILL_BE_ADJUSTED',
          field: 'term',
          message: `Prazo (${term} meses) será ajustado para ${this.limits.term.max} meses`
        })
      } else {
        result.errors.push({
          code: 'TERM_TOO_LONG',
          field: 'term',
          message: `Prazo (${term} meses) excede o limite máximo de ${this.limits.term.max} meses`,
          severity: 'blocking'
        })
      }
    }

    if (term < this.limits.term.min) {
      if (this.canAdjustTerm(proposal)) {
        result.warnings.push({
          code: 'TERM_WILL_BE_ADJUSTED',
          field: 'term',
          message: `Prazo (${term} meses) será ajustado para ${this.limits.term.min} meses`
        })
      } else {
        result.errors.push({
          code: 'TERM_TOO_SHORT',
          field: 'term',
          message: `Prazo (${term} meses) é menor que o mínimo de ${this.limits.term.min} meses`,
          severity: 'blocking'
        })
      }
    }
  }

  protected validatePropertyValue(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyValue =
      CreditProposalMapper.getPropertyValueAsNumber(proposal)

    if (propertyValue < this.limits.propertyValue.min) {
      result.errors.push({
        code: 'PROPERTY_VALUE_TOO_LOW',
        field: 'propertyValue',
        message: `Valor do imóvel (${this.formatCurrency(propertyValue)}) é menor que o mínimo de ${this.formatCurrency(this.limits.propertyValue.min)}`,
        severity: 'blocking'
      })
    }

    if (
      this.limits.propertyValue.max &&
      propertyValue > this.limits.propertyValue.max
    ) {
      result.errors.push({
        code: 'PROPERTY_VALUE_TOO_HIGH',
        field: 'propertyValue',
        message: `Valor do imóvel (${this.formatCurrency(propertyValue)}) excede o máximo de ${this.formatCurrency(this.limits.propertyValue.max)}`,
        severity: 'blocking'
      })
    }
  }

  protected validateIncome(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    if (!this.limits.income) return

    const income = CreditProposalMapper.getMonthlyIncomeAsNumber(proposal)

    if (this.limits.income.min && income < this.limits.income.min) {
      result.errors.push({
        code: 'INCOME_TOO_LOW',
        field: 'monthlyIncome',
        message: `Renda mensal (${this.formatCurrency(income)}) é menor que o mínimo de ${this.formatCurrency(this.limits.income.min)}`,
        severity: 'blocking'
      })
    }
  }

  protected abstract validateCustomRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void

  protected adjustLTV(proposal: CreditProposal): void {
    const ltv = this.calculateLTV(proposal)

    if (ltv > this.limits.ltv.max) {
      const propertyValue =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const newFinancedValue = (propertyValue * this.limits.ltv.max) / 100
      proposal.financedValue = this.formatCurrency(newFinancedValue)

      console.log(
        `🔧 LTV ajustado de ${ltv.toFixed(2)}% para ${this.limits.ltv.max}%`
      )
    }
  }

  protected adjustTerm(proposal: CreditProposal): void {
    const term = CreditProposalMapper.getTermAsNumber(proposal)

    if (term > this.limits.term.max) {
      proposal.term = this.limits.term.max.toString()
      console.log(
        `🔧 Prazo ajustado de ${term} para ${this.limits.term.max} meses`
      )
    } else if (term < this.limits.term.min) {
      proposal.term = this.limits.term.min.toString()
      console.log(
        `🔧 Prazo ajustado de ${term} para ${this.limits.term.min} meses`
      )
    }
  }

  protected abstract adjustCustomFields(proposal: CreditProposal): void

  protected canAdjustLTV(proposal: CreditProposal): boolean {
    return true // Por padrão, LTV sempre pode ser ajustado
  }

  protected canAdjustTerm(proposal: CreditProposal): boolean {
    return true // Por padrão, prazo sempre pode ser ajustado
  }

  protected abstract canAdjustCustomField(
    proposal: CreditProposal,
    field: string
  ): boolean

  // ========== MÉTODOS UTILITÁRIOS ==========

  protected calculateLTV(proposal: CreditProposal): number {
    const propertyValue =
      CreditProposalMapper.getPropertyValueAsNumber(proposal)
    const financedValue =
      CreditProposalMapper.getFinancedValueAsNumber(proposal)

    if (propertyValue === 0) return 0
    return (financedValue / propertyValue) * 100
  }

  protected calculateMaxFinancedValue(proposal: CreditProposal): number {
    const propertyValue =
      CreditProposalMapper.getPropertyValueAsNumber(proposal)
    return (propertyValue * this.limits.ltv.max) / 100
  }

  protected formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  protected extractRelevantFields(
    proposal: CreditProposal
  ): Partial<CreditProposal> {
    return {
      propertyValue: proposal.propertyValue,
      financedValue: proposal.financedValue,
      term: proposal.term,
      monthlyIncome: proposal.monthlyIncome,
      propertyType: proposal.propertyType
    }
  }

  protected calculateAdjustments(
    original: CreditProposal,
    adjusted: CreditProposal
  ): ValidationAdjustment[] {
    const adjustments: ValidationAdjustment[] = []

    if (original.financedValue !== adjusted.financedValue) {
      adjustments.push({
        field: 'financedValue',
        originalValue: original.financedValue,
        adjustedValue: adjusted.financedValue,
        reason: `LTV ajustado para respeitar limite máximo de ${this.limits.ltv.max}%`,
        rule: 'MAX_LTV'
      })
    }

    if (original.term !== adjusted.term) {
      adjustments.push({
        field: 'term',
        originalValue: original.term,
        adjustedValue: adjusted.term,
        reason: `Prazo ajustado para respeitar limites do ${this.bankName}`,
        rule: 'TERM_LIMITS'
      })
    }

    return adjustments
  }
}
