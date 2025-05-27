export interface BankResponseSimulation {
  simulationId: string
  bankName: string
  financingValue: number
  installments: number
  firstInstallment: number
  lastInstallment: number
  interestRate: number
  loanAmount: number
  amortizationType: string
  ltv: number
  cet: number
  uuidUser?: string
}
