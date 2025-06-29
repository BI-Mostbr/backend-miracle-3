import { GetItauSimulationResponse } from '@infra/dtos/GetSimulation.dto'

export class ItauGetSimulationResponseMapper {
  static mapItauToFrontend(itauResponse: any): GetItauSimulationResponse {
    return {
      nome:
        itauResponse.customerName || itauResponse.nome || 'Nome não informado',
      status: this.statusSimulatedToFrontend(itauResponse.data.credit.status),
      propertyValue: this.formatCurrency(itauResponse.data.propertyPrice || 0),
      totalCreditValue: this.formatCurrency(
        itauResponse.data.credit.maxFinancingValue
      ),
      maxInstallmentAmount: this.formatCurrency(
        itauResponse.data.credit.maxInstallmentValue || 0
      ),
      purchasingPower: this.formatCurrency(
        itauResponse.data.credit.maxInstallmentValue / 0.013431 || 0
      )
    }
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  static statusSimulatedToFrontend(value: number) {
    switch (value) {
      case 25:
        return 'Aprovado'
      default:
        return 'Reprovado'
    }
  }
}
