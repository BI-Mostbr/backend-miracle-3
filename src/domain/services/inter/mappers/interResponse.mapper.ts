import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export class InterResponseMapper {
  static convertToInternApiResponse(
    interResponse: any,
    simulation: CreditSimulation
  ): BankResponseSimulation {
    const interestRate = this.extractInterestRate(interResponse.produto)

    return {
      simulationId: interResponse.id,
      bankName: 'Inter',
      financingValue: simulation.financingValue,
      installments: simulation.installments,
      firstInstallment: interResponse.valorPrimeiraParcela || 0,
      lastInstallment: interResponse.valorUltimaParcela || 0,
      interestRate: interestRate,
      cet: this.convertPercentageToDecimal(interResponse.percentualCet),
      propertyValue: simulation.propertyValue,
      downPayment: simulation.propertyValue - simulation.financingValue,
      amortizationType:
        interResponse.sistemaAmortizacao ||
        simulation.amortizationType ||
        'SAC',
      ltv: (simulation.financingValue / simulation.propertyValue) * 100
    }
  }

  private static extractInterestRate(produto: string): number {
    try {
      if (!produto) return 0
      const match = produto.match(/(\d+(?:[,\.]\d+)?)\s*%/)

      if (match && match[1]) {
        const percentage = parseFloat(match[1].replace(',', '.'))
        return percentage / 100
      }

      return 0
    } catch (error) {
      console.warn('Erro ao extrair taxa de juros do produto Inter:', error)
      return 0
    }
  }

  private static convertPercentageToDecimal(percentage: number): number {
    try {
      if (typeof percentage !== 'number' || isNaN(percentage)) {
        return 0
      }
      return percentage / 100
    } catch (error) {
      console.warn('Erro ao converter porcentagem para decimal:', error)
      return 0
    }
  }

  private static generateSimulationId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `inter-${timestamp}-${random}`
  }

  static calculateMinimumIncome(firstInstallment: number): number {
    return firstInstallment * 3
  }

  static formatInterestRateForDisplay(rate: number): string {
    const percentage = (rate * 100).toFixed(2).replace('.', ',')
    return `${percentage}% + IPCA a.a`
  }
}
