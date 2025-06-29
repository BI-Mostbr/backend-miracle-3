export interface GetItauSimulationRequest {
  idSimulation: string
  includeCreditAnalysis: boolean
  includeInstallments: boolean
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
