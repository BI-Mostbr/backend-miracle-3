import { IItauProposalRepository, IItauProposalData } from '@infra/interfaces'
import { ItauProposalDetails } from '@infra/interfaces/ItauProposalDetails.interface'
import { PrismaClient } from '@prisma/client'

export class ItauProposalRepository implements IItauProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    details: ItauProposalDetails,
    clientMostId?: bigint
  ): Promise<IItauProposalData> {
    try {
      const itauData = await this.prisma.tb_itau.create({
        data: {
          id_proposta: details.id_proposta,
          decisao_credito: details.decisao_credito,
          emissao_contrato: details.emissao_contrato,
          assinatura_contrato: details.assinatura_contrato,
          vencimento_credito: details.vencimento_credito,
          liberacao_recurso: details.liberacao_recurso,
          entrada_pasta: details.entrada_pasta,
          status_global: details.status_global,
          id_credito: details.id_credito,
          descricao_credito: details.descricao_credito,
          id_contratacao: details.id_contratacao,
          descricao_contratacao: details.descricao_contratacao,
          id_atividade: details.id_atividade,
          prazo_aprovado: details.prazo_aprovado,
          taxa_juros_anual: details.taxa_juros_anual,
          valor_itbi: details.valor_itbi,
          valor_avaliacao: details.valor_avaliacao,
          credito_aprovado: details.credito_aprovado,
          agencia_numero: details.agencia_numero,
          agencia_funcional_gerente: details.agencia_funcional_gerente,
          id_cliente_most: clientMostId,
          ltv: details.ltv,
          prazo: details.prazo,
          cet: details.cet,
          valor_solicitado: details.valor_solicitado,
          id_status_most: details.id_status_most,
          id_situacao_most: details.id_situacao_most,
          valor_fgts: details.valor_fgts,
          valor_compra_venda: details.valor_compra_venda,
          valor_tarifas: details.valor_tarifas,
          total_credito: details.total_credito,
          proposal_uuid: details.proposal_uuid,
          proposta_copiada: details.proposta_copiada,
          id_produto: details.id_produto,
          created_at: new Date()
        }
      })

      console.log(
        `💾 Proposta Itaú salva com dados completos - ID: ${itauData.id_most}`
      )
      return itauData
    } catch (error) {
      console.error('❌ Erro ao salvar proposta Itaú com detalhes:', error)
      throw new Error(
        `Falha ao salvar proposta Itaú com detalhes: ${(error as Error).message}`
      )
    }
  }
}
