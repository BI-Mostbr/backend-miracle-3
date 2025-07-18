import { ISantanderProposalDetails } from '@infra/interfaces/SantanderProposalDetails.interface'
import { PrismaClient } from '@prisma/client'

export class SantanderProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    details: ISantanderProposalDetails,
    clientMostId?: bigint
  ): Promise<ISantanderProposalDetails> {
    try {
      const santanderData = await this.prisma.tb_santander.create({
        data: {
          id_proposta: details.id_proposta,
          id_simulacao: details.id_simulacao,
          id_cliente: clientMostId?.toString(),
          produto: details.produto,
          id_produto: details.id_produto,
          valor_imovel: details.valor_imovel,
          valor_fgts: details.valor_fgts,
          prazo_anos: details.prazo_anos,
          prazo_meses: details.prazo_meses,
          valor_financiamento_minimo: details.valor_financiamento_minimo,
          valor_financiado_maximo: details.valor_financiado_maximo,
          valor_entrada: details.valor_entrada,
          valor_despesas: details.valor_despesas,
          valor_iof: details.valor_iof,
          valuation_fee_amount: details.valuation_fee_amount,
          valor_financiamento_despesas: details.valor_financiamento_despesas,
          indexador_tr: details.indexador_tr,
          tipo_carteira: details.tipo_carteira,
          campanha: details.campanha,
          id_campanha: details.id_campanha,
          segmento: details.segmento,
          id_segmento: details.id_segmento,
          oferta_relacionamento: details.oferta_relacionamento,
          id_oferta_relacionamento: details.id_oferta_relacionamento,
          seguro: details.seguro,
          id_seguro: details.id_seguro,
          tipo_amortizacao: details.tipo_amortizacao,
          chave_tipo_amortizacao: details.chave_tipo_amortizacao,
          tipo_pagamento: details.tipo_pagamento,
          chave_tipo_pagamento: details.chave_tipo_pagamento,
          tipo_simulacao_calculada: details.tipo_simulacao_calculada,
          valor_juros_anual: details.valor_juros_anual,
          valor_juros_mensal: details.valor_juros_mensal,
          valor_primeira_parcela: details.valor_primeira_parcela,
          valor_ultima_parcela: details.valor_ultima_parcela,
          valor_cet: details.valor_cet,
          valor_cesh: details.valor_cesh,
          situacao: details.situacao,
          ltv: details.ltv,
          valor_financiado: details.valor_financiado,
          id_cliente_most: Number(clientMostId),
          id_status_most: details.id_status_most,
          id_situacao_most: details.id_situacao_most,
          id_substatus_most: details.id_substatus_most,
          status_global: details.status_global,
          status_simulation: details.status_simulation,
          status_creditAnalysis: details.status_creditAnalysis,
          status_informationRegister: details.status_informationRegister,
          status_documentSubmission: details.status_documentSubmission,
          status_inspection: details.status_inspection,
          status_documentAnalysis: details.status_documentAnalysis,
          status_currentAccount: details.status_currentAccount,
          status_interveningPayer: details.status_interveningPayer,
          status_dataAndValueVerification:
            details.status_dataAndValueVerification,
          status_fgts: details.status_fgts,
          status_printingAndSignature: details.status_printingAndSignature,
          status_signatureCheck: details.status_signatureCheck,
          status_contractSubmission: details.status_contractSubmission,
          status_releaseOfFunds: details.status_releaseOfFunds,
          taxa_juros_percent: details.taxa_juros_percent,
          total_documentos: details.total_documentos,
          proposta_copiada: details.proposta_copiada,
          id_cliente_incorporador: details.id_cliente_incorporador
        }
      })

      return santanderData
    } catch (error) {
      console.error('❌ Erro ao salvar proposta Itaú com detalhes:', error)
      throw new Error(
        `Falha ao salvar proposta Itaú com detalhes: ${(error as Error).message}`
      )
    }
  }
}
