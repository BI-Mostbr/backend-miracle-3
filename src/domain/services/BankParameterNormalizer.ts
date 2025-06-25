import { CreditSimulation } from '@domain/entities'

export type PropertyType = 'Residencial' | 'Comercial'

export interface CreditSimulationWithPropertyType extends CreditSimulation {
  propertyType: PropertyType
}

export interface BankNormalizationRules {
  bankName: string
  minimumInstallments: {
    Residencial: number
    Comercial: number
  }
  loanToValueRatioLimits: {
    Residencial: { min: number; max: number }
    Comercial: { min: number; max: number }
  }
  minimumFinancingValue: number
}

export interface NormalizedSimulation {
  originalSimulation: CreditSimulationWithPropertyType
  normalizedSimulation: CreditSimulation
  adjustments: SimulationAdjustment[]
}

export interface SimulationAdjustment {
  fieldName: string
  originalValue: any
  adjustedValue: any
  adjustmentReason: string
}

export class BankParameterNormalizer {
  private static readonly BANK_RULES: Record<string, BankNormalizationRules> = {
    itau: {
      bankName: 'itau',
      minimumInstallments: {
        Residencial: 60,
        Comercial: 60
      },
      minimumFinancingValue: 98000,
      loanToValueRatioLimits: {
        Residencial: { min: 20, max: 80 },
        Comercial: { min: 30, max: 70 }
      }
    },
    santander: {
      bankName: 'santander',
      minimumInstallments: {
        Residencial: 60,
        Comercial: 60
      },
      minimumFinancingValue: 98000,
      loanToValueRatioLimits: {
        Residencial: { min: 20, max: 80 },
        Comercial: { min: 30, max: 70 }
      }
    },
    bradesco: {
      bankName: 'bradesco',
      minimumInstallments: {
        Residencial: 120,
        Comercial: 120
      },
      minimumFinancingValue: 100000,
      loanToValueRatioLimits: {
        Residencial: { min: 30, max: 70 },
        Comercial: { min: 30, max: 70 }
      }
    },
    inter: {
      bankName: 'inter',
      minimumInstallments: {
        Residencial: 12,
        Comercial: 12
      },
      minimumFinancingValue: 125000,
      loanToValueRatioLimits: {
        Residencial: { min: 25, max: 75 },
        Comercial: { min: 85, max: 85 } // Inter comercial tem regra específica
      }
    }
  }

  static normalizeSimulationForBank(
    simulation: CreditSimulationWithPropertyType,
    bankName: string
  ): NormalizedSimulation {
    const bankKey = bankName.toLowerCase()
    const bankRules = this.getBankRules(bankKey)

    const normalizedSimulation: CreditSimulation = { ...simulation }
    const adjustments: SimulationAdjustment[] = []

    // Aplica ajustes sempre pelo valor mínimo
    this.applyInstallmentMinimumAdjustment(
      normalizedSimulation,
      simulation,
      bankRules,
      adjustments
    )
    this.applyFinancingValueMinimumAdjustment(
      normalizedSimulation,
      simulation,
      bankRules,
      adjustments
    )
    this.applyLoanToValueRatioAdjustment(
      normalizedSimulation,
      simulation,
      bankRules,
      adjustments
    )

    return {
      originalSimulation: simulation,
      normalizedSimulation,
      adjustments
    }
  }

  static normalizeSimulationForAllBanks(
    simulation: CreditSimulationWithPropertyType
  ): Record<string, NormalizedSimulation> {
    const normalizationResults: Record<string, NormalizedSimulation> = {}

    for (const bankKey of Object.keys(this.BANK_RULES)) {
      try {
        normalizationResults[bankKey] = this.normalizeSimulationForBank(
          simulation,
          bankKey
        )
      } catch (error) {
        console.warn(
          `Failed to normalize simulation for bank: ${bankKey}`,
          error
        )
      }
    }

    return normalizationResults
  }

  static simulationRequiresAdjustment(
    simulation: CreditSimulationWithPropertyType,
    bankName: string
  ): boolean {
    const normalizationResult = this.normalizeSimulationForBank(
      simulation,
      bankName
    )
    return normalizationResult.adjustments.length > 0
  }

  static getAllBankNormalizationRules(): Record<
    string,
    BankNormalizationRules
  > {
    return { ...this.BANK_RULES }
  }

  private static getBankRules(bankKey: string): BankNormalizationRules {
    const bankRules = this.BANK_RULES[bankKey]
    if (!bankRules) {
      throw new Error(`Bank normalization rules not found for: ${bankKey}`)
    }
    return bankRules
  }

  private static applyInstallmentMinimumAdjustment(
    normalizedSimulation: CreditSimulation,
    originalSimulation: CreditSimulationWithPropertyType,
    bankRules: BankNormalizationRules,
    adjustments: SimulationAdjustment[]
  ): void {
    const minimumInstallments =
      bankRules.minimumInstallments[originalSimulation.propertyType]

    if (originalSimulation.installments < minimumInstallments) {
      normalizedSimulation.installments = minimumInstallments

      adjustments.push({
        fieldName: 'installments',
        originalValue: originalSimulation.installments,
        adjustedValue: minimumInstallments,
        adjustmentReason: `${bankRules.bankName} requer mínimo de ${minimumInstallments} parcelas para imóveis ${originalSimulation.propertyType === 'Residencial' ? 'residenciais' : 'comerciais'}`
      })
    }
  }

  private static applyFinancingValueMinimumAdjustment(
    normalizedSimulation: CreditSimulation,
    originalSimulation: CreditSimulationWithPropertyType,
    bankRules: BankNormalizationRules,
    adjustments: SimulationAdjustment[]
  ): void {
    if (originalSimulation.financingValue < bankRules.minimumFinancingValue) {
      const originalFinancingValue = originalSimulation.financingValue
      const adjustedFinancingValue = bankRules.minimumFinancingValue

      normalizedSimulation.financingValue = adjustedFinancingValue

      // Mantém a proporção LTV original ao ajustar o valor do imóvel
      const originalLoanToValueRatio =
        (originalFinancingValue / originalSimulation.propertyValue) * 100
      const adjustedPropertyValue =
        adjustedFinancingValue / (originalLoanToValueRatio / 100)

      normalizedSimulation.propertyValue = Math.max(
        adjustedPropertyValue,
        originalSimulation.propertyValue
      )

      adjustments.push({
        fieldName: 'financingValue',
        originalValue: originalFinancingValue,
        adjustedValue: adjustedFinancingValue,
        adjustmentReason: `${bankRules.bankName} exige financiamento mínimo de ${this.formatCurrency(adjustedFinancingValue)}`
      })
    }
  }

  private static applyLoanToValueRatioAdjustment(
    normalizedSimulation: CreditSimulation,
    originalSimulation: CreditSimulationWithPropertyType,
    bankRules: BankNormalizationRules,
    adjustments: SimulationAdjustment[]
  ): void {
    const ltvLimits =
      bankRules.loanToValueRatioLimits[originalSimulation.propertyType]

    const currentLoanToValuePercentage =
      (normalizedSimulation.financingValue /
        normalizedSimulation.propertyValue) *
      100

    // Verifica se LTV está abaixo do mínimo
    if (currentLoanToValuePercentage < ltvLimits.min) {
      const adjustedFinancingValue = Math.round(
        normalizedSimulation.propertyValue * (ltvLimits.min / 100)
      )

      normalizedSimulation.financingValue = adjustedFinancingValue

      adjustments.push({
        fieldName: 'loanToValueRatio',
        originalValue: `${currentLoanToValuePercentage.toFixed(2)}%`,
        adjustedValue: `${ltvLimits.min}%`,
        adjustmentReason: `${bankRules.bankName} requer LTV mínimo de ${ltvLimits.min}% para imóveis ${originalSimulation.propertyType === 'Residencial' ? 'residenciais' : 'comerciais'}`
      })
    }
    // Verifica se LTV está acima do máximo
    else if (currentLoanToValuePercentage > ltvLimits.max) {
      const adjustedFinancingValue = Math.round(
        normalizedSimulation.propertyValue * (ltvLimits.max / 100)
      )

      normalizedSimulation.financingValue = adjustedFinancingValue

      adjustments.push({
        fieldName: 'loanToValueRatio',
        originalValue: `${currentLoanToValuePercentage.toFixed(2)}%`,
        adjustedValue: `${ltvLimits.max}%`,
        adjustmentReason: `${bankRules.bankName} permite LTV máximo de ${ltvLimits.max}% para imóveis ${originalSimulation.propertyType === 'Residencial' ? 'residenciais' : 'comerciais'}`
      })
    }
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
}
