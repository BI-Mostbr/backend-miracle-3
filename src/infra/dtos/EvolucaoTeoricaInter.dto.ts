export interface EvolucaoTeoricaRequest {
  proposalNumber: string
}

export interface EvolucaoTeoricaResponse {
  success: boolean
  data?: {
    proposalNumber: string
    dataCriacao: string
    url: string
  }
  error?: string
  timestamp: string
}

export interface InterEvolucaoTeoricaResponse {
  dataCriacao: string
  url: string
}
