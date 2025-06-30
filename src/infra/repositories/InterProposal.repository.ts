import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { IInterProposalRepository, IInterProposalData } from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'

export class InterProposalRepository implements IInterProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    flowType: string
  ): Promise<IInterProposalData> {
    try {
      let clientMostId: bigint | undefined

      // Se não for reenvio, buscar ou criar o cliente
      if (flowType !== 'reenvio') {
        const existingClient = await this.prisma.tb_clientes.findUnique({
          where: { cpf: proposal.customerCpf }
        })
        clientMostId = existingClient?.id
      }

      const interData = await this.prisma.tb_inter.create({
        data: {
          cpf: proposal.customerCpf,
          id_proposta: bankResponse.proposalId,
          id_simulacao: bankResponse.simulationId,
          valorFinanciamento: proposal.financingValue,
          valorEntrada: proposal.downPayment,
          valorImovel: proposal.propertyValue,
          prazoEmprestimo: BigInt(proposal.installments),
          tipoProduto: proposal.productType,
          sistemaAmortizacao: proposal.amortizationType,
          estadoImovel: proposal.propertyState,
          tipoImovel: proposal.propertyType,
          etapaAtual: 'PROPOSTA_ENVIADA',
          situacao: 'EM_ANALISE',
          id_cliente_most: clientMostId,
          ltv: this.calculateLTV(
            proposal.financingValue,
            proposal.propertyValue
          ),
          ltv_text: `${this.calculateLTV(proposal.financingValue, proposal.propertyValue).toFixed(2)}%`,
          id_produto: this.getProductId(proposal.productType),
          created_at: new Date()
        }
      })

      console.log(`💾 Proposta Inter salva com ID: ${interData.id}`)
      return interData
    } catch (error) {
      console.error('❌ Erro ao salvar proposta Inter:', error)
      throw new Error(
        `Falha ao salvar proposta Inter: ${(error as Error).message}`
      )
    }
  }

  private calculateLTV(financingValue: number, propertyValue: number): number {
    return (financingValue / propertyValue) * 100
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
