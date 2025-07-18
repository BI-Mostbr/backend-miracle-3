import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export class ItauResponseMapper {
  static convertToInternApiResponse(
    itauResponse: any,
    simulation: CreditSimulation
  ): BankResponseSimulation {
    return {
      simulationId: itauResponse.data[0].simulationId,
      bankName: 'Itaú',
      financingValue: simulation.financingValue || 0,
      installments: itauResponse.data[0].installments || 0,
      firstInstallment: itauResponse.data[0].firstInstallment.totalValue || 0,
      lastInstallment: itauResponse.data[0].lastInstallment.totalValue || 0,
      interestRate: itauResponse.data[0].annualRate || 0,
      cet: itauResponse.data[0].cetAnnual || 0,
      propertyValue: simulation.propertyValue,
      downPayment: simulation.propertyValue - simulation.financingValue,
      amortizationType: simulation.amortizationType || 'SAC',
      ltv: (simulation.financingValue / simulation.propertyValue) * 100,
      uuidUser: itauResponse.uuid_user
    }
  }
}
