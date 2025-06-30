import { BankProposalResponse, CreditProposal } from '@domain/entities'

export class ItauProposalResponseMapper {
  static convertToInternalResponse(
    itauResponse: any,
    proposal: CreditProposal
  ): BankProposalResponse {
    return {
      proposalId: itauResponse.data.proposalId,
      bankName: 'Itaú',
      proposalNumber: itauResponse.data.proposalNumber,
      status: 'ENVIADO',

      bankSpecificData: {
        itau: {
          proposalNumber: itauResponse.data.proposalNumber,
          proposalId: itauResponse.data.proposalId
        }
      }
    }
  }

  static mapStatusToInternal(itauStatus: string): string {
    const statusMap: { [key: string]: string } = {
      SENT: 'ENVIADO',
      PENDING: 'PENDENTE',
      APPROVED: 'APROVADO',
      REJECTED: 'REJEITADO',
      CANCELLED: 'CANCELADO'
    }

    return statusMap[itauStatus] || 'DESCONHECIDO'
  }

  static generateSimulationId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `itau-prop-${timestamp}-${random}`
  }
}
