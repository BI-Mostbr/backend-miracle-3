import { BankProposalResponse } from '@domain/entities'

export interface InterProposalResponse {
  idProposta: string
  idSimulacao: string
}

export class InterProposalResponseMapper {
  static mapToInternalResponse(
    interResponse: InterProposalResponse,
    proposalNumber?: string
  ): BankProposalResponse {
    const proposalId = interResponse.idProposta
    const simulationId = interResponse.idSimulacao

    const response: BankProposalResponse = {
      bankName: 'Inter',
      proposalId: proposalNumber || '',
      simulationId: simulationId,
      status: 'ENVIADO',
      bankSpecificData: {
        inter: {
          idProposta: proposalId,
          proposalNumber: proposalNumber || '',
          idSimulacao: simulationId
        }
      }
    }
    return response
  }
}
