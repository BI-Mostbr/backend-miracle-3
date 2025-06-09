import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export class ItauResponseMapper {
  static convertToInternApiResponse(
    itauResponse: any,
    simulation: CreditSimulation
  ): BankResponseSimulation {
    return {
      simulationId: itauResponse.id,
      bankName: 'Itaú',
      financingValue: itauResponse.financingValue || 0,
      installments: itauResponse.installments || 0,
      firstInstallment: itauResponse.firstInstallment || 0,
      lastInstallment: itauResponse.lastInstallment || 0,
      interestRate: itauResponse.interestRate || 0,
      cet: itauResponse.cet || 0,
      propertyValue: simulation.propertyValue,
      downPayment: simulation.propertyValue - simulation.financingValue,
      amortizationType: simulation.amortizationType || 'SAC',
      ltv: (simulation.financingValue / simulation.propertyValue) * 100,
      uuidUser: itauResponse.uuid_user,
      userId: simulation.userId.toString()
    }
  }
}
