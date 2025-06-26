import { GetItauSimulationResponse } from '@infra/dtos/GetSimulation.dto'

export class ItauGetSimulationResponseMapper {
  static mapItauToFrontend(itauResponse: any): GetItauSimulationResponse {
    return {
      nome:
        itauResponse.customerName || itauResponse.nome || 'Nome não informado',
      status: itauResponse.status || itauResponse.creditStatus || 'aprovado',
      propertyValue: this.formatCurrency(itauResponse.propertyValue || 0),
      totalCreditValue: this.formatCurrency(
        itauResponse.creditValue || itauResponse.valorCredito || 0
      ),
      maxInstallmentAmount: this.formatCurrency(
        itauResponse.maxInstallment || itauResponse.valorMaximoParcela || 0
      ),
      purchasingPower: this.formatCurrency(
        itauResponse.purchasingPower || itauResponse.poderCompra || 0
      )
    }
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }
}
