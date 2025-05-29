import { BankResponseSimulation } from '@domain/entities'

export class ItauResponseMapper {
  static convertToInternApiResponse(itauResponse: any): BankResponseSimulation {
    return {
      simulationId: itauResponse.id || 'mock-id',
      bankName: 'Itaú',
      financingValue: itauResponse.financingValue || 0,
      installments: itauResponse.installments || 0,
      firstInstallment: itauResponse.firstInstallment || 0,
      lastInstallment: itauResponse.lastInstallment || 0,
      interestRate: itauResponse.interestRate || 0,
      loanAmount: itauResponse.loanAmount || 0,
      amortizationType: itauResponse.amortizationType || 'SAC',
      ltv: itauResponse.ltv || 0,
      cet: itauResponse.cet || 0,
      uuidUser: itauResponse.uuidUser
    }
  }
}
