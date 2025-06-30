export interface BankProposalResponse {
  proposalId: string
  simulationId?: string
  bankName: string
  proposalNumber?: string
  status: string

  // Dados específicos por banco
  bankSpecificData?: {
    itau?: {
      proposalNumber: string
      proposalId: string
    }
    inter?: {
      idProposta: string
      idSimulacao: string
    }
  }
}
