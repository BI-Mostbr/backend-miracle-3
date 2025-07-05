import { BankProposalResponse } from '@domain/entities'

export interface InterProposalResponse {
  idProposta: string
  idSimulacao: string
}

export class InterProposalResponseMapper {
  static mapToInternalResponse(
    interResponse: InterProposalResponse
  ): BankProposalResponse {
    console.log('🔄 Mapeando resposta do Inter:', interResponse)

    const proposalId = interResponse.idProposta
    const simulationId = interResponse.idSimulacao

    const response: BankProposalResponse = {
      bankName: 'Inter',
      proposalId: proposalId,
      simulationId: simulationId,
      status: 'ENVIADO',
      bankSpecificData: {
        inter: {
          idProposta: proposalId,
          idSimulacao: simulationId
        }
      }
    }

    console.log('✅ Resposta mapeada:')
    console.log(`📄 ID Proposta: ${proposalId}`)
    console.log(`📄 ID Simulação: ${simulationId}`)

    return response
  }
}
