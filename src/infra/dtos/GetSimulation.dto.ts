export interface GetItauSimulationRequest {
  idSimulation: string
  includeCreditAnalysis: boolean
  includeInstallments?: boolean
}

export interface GetSantanderSimulationRequest {
  idSimulation: string
}
export interface GetItauSimulationResponse {
  nome: string
  status: string
  propertyValue: string
  totalCreditValue: string
  maxInstallmentAmount: string
  purchasingPower: string
}
export interface ItauInstallment {
  number: number
  remainingMonths: number
  dueDate: string
  beginningBalance: number
  totalValue: number
  amortization: number
  interest: number
  endingBalance: number
  insurerDfi: number
  insurerMip: number
  tac: number
  iof: number
}

export interface GetItauSimulationWithInstallmentsResponse {
  simulationId: string
  amortizationType: string
  financingType: string
  insuranceType: string
  feeType: string
  loanAmount: number
  period: number
  downPayment: number

  firstInstallment: ItauInstallment
  lastInstallment: ItauInstallment

  cetAnnual: number
  cemAnnual: number
  ceshAnnual: number
  installmentsTotalValue: number
  annualRate: number
  monthlyRate: number

  productType: string
  propertyType: string
  propertyPrice: number
  includeRegistryCosts: boolean
  includePropertyEvaluation: boolean
  includeIof: boolean

  proponents: Array<{ id: string }>
  installments: ItauInstallment[]
}

export interface GetSantanderSimulationResponse {
  stringBase64: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}
