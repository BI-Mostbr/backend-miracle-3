import { CreditProposal } from '@domain/entities'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  adjustments: ValidationAdjustment[]
  bankName: string
  originalProposal: Partial<CreditProposal>
  adjustedProposal?: Partial<CreditProposal>
}

export interface ValidationError {
  code: string
  field: string
  message: string
  severity: 'blocking' | 'warning'
}

export interface ValidationWarning {
  code: string
  field: string
  message: string
  recommendation?: string
}

export interface ValidationAdjustment {
  field: string
  originalValue: any
  adjustedValue: any
  reason: string
  rule: string
}

export interface BankLimits {
  ltv: {
    min: number
    max: number
    propertyTypes?: string[]
  }
  term: {
    min: number
    max: number
  }
  propertyValue: {
    min: number
    max?: number
  }
  income?: {
    min?: number
    multiplier?: number
  }
}

export interface IBankValidationStrategy {
  readonly bankName: string
  readonly limits: BankLimits

  /**
   * Valida proposta sem modificá-la
   */
  validate(proposal: CreditProposal): ValidationResult

  /**
   * Ajusta proposta para atender às regras do banco
   */
  adjustProposal(proposal: CreditProposal): CreditProposal

  /**
   * Valida e ajusta em uma única operação
   */
  validateAndAdjust(proposal: CreditProposal): ValidationResult

  /**
   * Verifica se um ajuste específico é possível
   */
  canAdjust(proposal: CreditProposal, field: string): boolean

  /**
   * Retorna sugestões de ajuste
   */
  getSuggestions(proposal: CreditProposal): ValidationWarning[]
}
