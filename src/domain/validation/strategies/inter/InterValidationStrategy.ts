import { CreditProposal } from '@domain/entities'
import { BaseBankValidationStrategy } from '../base/BaseBankValidationStrategy'
import {
  BankLimits,
  ValidationResult
} from '@infra/interfaces/IBankValidationStrategy.interface'

export class InterValidationStrategy extends BaseBankValidationStrategy {
  public readonly bankName = 'Inter'

  public readonly limits: BankLimits = {
    ltv: {
      min: 0,
      max: 75, // LTV máximo 75% para imóveis residenciais
      propertyTypes: ['residencial', 'casa', 'apartamento']
    },
    term: {
      min: 24, // Prazo mínimo 24 meses
      max: 360 // Prazo máximo 360 meses
    },
    propertyValue: {
      min: 200000, // Valor mínimo R$ 200.000
      max: undefined // Sem limite máximo
    },
    income: {
      min: 1500, // Renda mínima R$ 1.500 (exemplo)
      multiplier: 5 // Até 5x a renda (exemplo)
    }
  }

  protected validateCustomRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log('🔍 Aplicando regras específicas do Inter...')

    // Regra 1: Verificar tipo de imóvel para LTV
    this.validateLTVByPropertyType(proposal, result)

    // Regra 2: Validar compatibilidade renda vs financiamento
    this.validateIncomeCompatibility(proposal, result)

    // Regra 3: Regras específicas por região (exemplo)
    this.validateRegionalRules(proposal, result)
  }

  protected adjustCustomFields(proposal: CreditProposal): void {
    console.log('🔧 Aplicando ajustes específicos do Inter...')

    // Ajuste específico: Se apartamento, pode ter LTV um pouco maior
    this.adjustLTVByPropertyType(proposal)
  }

  protected canAdjustCustomField(
    proposal: CreditProposal,
    field: string
  ): boolean {
    switch (field) {
      case 'propertyType':
        return false // Tipo de imóvel não pode ser ajustado
      case 'region':
        return false // Região não pode ser ajustada
      default:
        return false
    }
  }

  // ========== REGRAS ESPECÍFICAS DO INTER ==========

  private validateLTVByPropertyType(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyType = proposal.propertyType?.toLowerCase()
    const ltv = this.calculateLTV(proposal)

    // Regra específica: Casas têm limite menor que apartamentos
    let maxLTVForType = this.limits.ltv.max

    switch (propertyType) {
      case 'casa':
      case 'casa_residencial':
        maxLTVForType = 70 // Casas: máximo 70%
        break
      case 'apartamento':
      case 'apartamento_residencial':
        maxLTVForType = 75 // Apartamentos: máximo 75%
        break
      case 'comercial':
        maxLTVForType = 60 // Comercial: máximo 60%
        break
    }

    if (ltv > maxLTVForType) {
      result.warnings.push({
        code: 'LTV_BY_PROPERTY_TYPE',
        field: 'ltv',
        message: `LTV para ${propertyType} no Inter é limitado a ${maxLTVForType}% (atual: ${ltv.toFixed(2)}%)`,
        recommendation: `Ajustar valor financiado para ${maxLTVForType}%`
      })
    }
  }

  private validateIncomeCompatibility(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    if (!this.limits.income?.multiplier) return

    const income = this.getMonthlyIncomeAsNumber(proposal)
    const financedValue = this.getFinancedValueAsNumber(proposal)
    const maxFinancing = income * this.limits.income.multiplier

    if (financedValue > maxFinancing) {
      result.errors.push({
        code: 'FINANCING_EXCEEDS_INCOME_MULTIPLE',
        field: 'financedValue',
        message: `Valor financiado (${this.formatCurrency(financedValue)}) excede ${this.limits.income.multiplier}x a renda mensal`,
        severity: 'blocking'
      })
    }
  }

  private validateRegionalRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const state = proposal.uf?.toUpperCase()

    // Exemplo: Inter não opera em alguns estados
    const restrictedStates = ['AC', 'RR', 'AP'] // Exemplo

    if (restrictedStates.includes(state || '')) {
      result.errors.push({
        code: 'RESTRICTED_STATE',
        field: 'uf',
        message: `Inter não opera no estado: ${state}`,
        severity: 'blocking'
      })
    }

    // Exemplo: Valores mínimos diferentes por região
    const propertyValue = this.getPropertyValueAsNumber(proposal)
    const metropolitanAreas = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC']

    if (metropolitanAreas.includes(state || '')) {
      const minValueMetropolitan = 300000 // R$ 300.000 em regiões metropolitanas

      if (propertyValue < minValueMetropolitan) {
        result.errors.push({
          code: 'MIN_VALUE_METROPOLITAN',
          field: 'propertyValue',
          message: `Valor mínimo para ${state} é ${this.formatCurrency(minValueMetropolitan)}`,
          severity: 'blocking'
        })
      }
    }
  }

  private adjustLTVByPropertyType(proposal: CreditProposal): void {
    const propertyType = proposal.propertyType?.toLowerCase()
    const ltv = this.calculateLTV(proposal)
    const propertyValue = this.getPropertyValueAsNumber(proposal)

    let maxLTVForType = this.limits.ltv.max

    switch (propertyType) {
      case 'casa':
      case 'casa_residencial':
        maxLTVForType = 70
        break
      case 'apartamento':
      case 'apartamento_residencial':
        maxLTVForType = 75
        break
      case 'comercial':
        maxLTVForType = 60
        break
    }

    if (ltv > maxLTVForType) {
      const newFinancedValue = (propertyValue * maxLTVForType) / 100
      proposal.financedValue = this.formatCurrency(newFinancedValue)

      console.log(
        `🔧 LTV ajustado para ${propertyType}: ${ltv.toFixed(2)}% → ${maxLTVForType}%`
      )
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  private getMonthlyIncomeAsNumber(proposal: CreditProposal): number {
    if (!proposal.monthlyIncome) return 0
    return (
      parseFloat(
        proposal.monthlyIncome
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private getFinancedValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.financedValue) return 0
    return (
      parseFloat(
        proposal.financedValue
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private getPropertyValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.propertyValue) return 0
    return (
      parseFloat(
        proposal.propertyValue
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  // ========== MÉTODOS PÚBLICOS ESPECÍFICOS DO INTER ==========

  /**
   * Verifica se o Inter aceita o tipo de imóvel
   */
  public acceptsPropertyType(propertyType: string): boolean {
    const acceptedTypes = [
      'residencial',
      'casa',
      'apartamento',
      'casa_residencial',
      'apartamento_residencial'
    ]
    return acceptedTypes.includes(propertyType?.toLowerCase())
  }

  /**
   * Retorna o LTV máximo para um tipo específico de imóvel
   */
  public getMaxLTVForPropertyType(propertyType: string): number {
    switch (propertyType?.toLowerCase()) {
      case 'casa':
      case 'casa_residencial':
        return 70
      case 'apartamento':
      case 'apartamento_residencial':
        return 75
      case 'comercial':
        return 60
      default:
        return this.limits.ltv.max
    }
  }

  /**
   * Verifica se o Inter opera no estado
   */
  public operatesInState(state: string): boolean {
    const restrictedStates = ['AC', 'RR', 'AP']
    return !restrictedStates.includes(state?.toUpperCase())
  }
}
