import { BankProposalResponse, CreditProposal } from '@domain/entities'

export class InterProposalResponseMapper {
  static convertToInternalResponse(
    interResponse: any,
    proposal: CreditProposal
  ): BankProposalResponse {
    return {
      proposalId: interResponse.idProposta,
      simulationId: interResponse.idSimulacao,
      bankName: 'Inter',
      proposalNumber: this.extractProposalNumber(interResponse.idProposta),
      status: 'ENVIADO',

      bankSpecificData: {
        inter: {
          idProposta: interResponse.idProposta,
          idSimulacao: interResponse.idSimulacao
        }
      }
    }
  }

  static mapStatusToInternal(interStatus: string): string {
    const statusMap: { [key: string]: string } = {
      CRIADA: 'ENVIADO',
      EM_ANALISE: 'EM_ANALISE',
      APROVADA: 'APROVADO',
      REJEITADA: 'REJEITADO',
      CANCELADA: 'CANCELADO',
      FINALIZADA: 'FINALIZADO'
    }

    return statusMap[interStatus] || 'DESCONHECIDO'
  }

  private static extractProposalNumber(proposalId: string): string {
    // Extrair um número sequencial do UUID para exibição
    const timestamp = Date.now().toString().slice(-6)
    return `INTER${timestamp}`
  }

  static generateSimulationId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `inter-prop-${timestamp}-${random}`
  }
}
