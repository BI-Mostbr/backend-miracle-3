export interface UpdateDecisionBankRequest {
  cpf: string
  idProposta: string
  idBanco: number
}

export interface RemoveDecisionBankRequest {
  cpf: string
}

export interface UpdateResponsibleUserRequest {
  cpf: string
  idConsultor: number
}

export interface UpdatePartnerRequest {
  cpf: string
  idPartner: number
}

export interface UpdateClientNameRequest {
  cpf: string
  clientName: string
}

export interface ClientUpdateResponse {
  success: boolean
  message: string
  cpf?: string
  updatedAt?: string
}
