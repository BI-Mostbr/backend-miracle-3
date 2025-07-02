import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { IItauProposalRepository, IItauProposalData } from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'
import { cleanMoney } from 'Utils/removeMasks'

export class ItauProposalRepository implements IItauProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    flowType: string
  ): Promise<IItauProposalData> {
    try {
      let clientMostId: bigint | undefined

      // Se não for reenvio, buscar ou criar o cliente
      if (flowType !== 'reenvio') {
        const existingClient = await this.prisma.tb_clientes.findUnique({
          where: { cpf: proposal.document }
        })
        clientMostId = existingClient?.id
      }
      const financedValue = cleanMoney(proposal.financedValue)
      const propertyValue = cleanMoney(proposal.propertyValue)
      const ltv = this.calculateLTV(financedValue, propertyValue)
      const itauData = await this.prisma.tb_itau.create({
        data: {
          id_proposta: bankResponse.proposalId,
          status_global: 'ENVIADO',
          valor_solicitado: financedValue,
          prazo: BigInt(proposal.term),
          valor_compra_venda: propertyValue,
          valor_fgts: cleanMoney(proposal.fgtsValue || 0),
          ltv: ltv,
          id_cliente_most: clientMostId,
          proposal_uuid: bankResponse.bankSpecificData?.itau?.proposalId,
          proposta_copiada: false,
          id_produto: this.getProductId(proposal.selectedProductOption),
          created_at: new Date()
        }
      })

      console.log(`💾 Proposta Itaú salva com ID: ${itauData.id_most}`)
      return itauData
    } catch (error) {
      console.error('❌ Erro ao salvar proposta Itaú:', error)
      throw new Error(
        `Falha ao salvar proposta Itaú: ${(error as Error).message}`
      )
    }
  }

  private calculateLTV(financingValue: number, propertyValue: number): string {
    const ltv = (financingValue / propertyValue) * 100
    return `${ltv.toFixed(2)}%`
  }

  private getProductId(productType: string): bigint {
    const productMap: { [key: string]: bigint } = {
      ISOLADO: BigInt(1),
      PILOTO: BigInt(2),
      REPASSE: BigInt(3),
      PORTABILIDADE: BigInt(4)
    }
    return productMap[productType] || BigInt(1)
  }
}
