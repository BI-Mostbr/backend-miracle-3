import { CreditProposal } from '@domain/entities'
import { ItauProposalDetails } from '@infra/interfaces/ItauProposalDetails.interface'
import { DeParaRepository } from '@infra/repositories/DePara.repository'
import { cleanMoney } from 'Utils/removeMasks'

export class ItauProposalDetailsMapper {
  static async mapFromItauResponse(
    itauResponse: any,
    proposal: CreditProposal,
    deParaRepository: DeParaRepository,
    clientMostId?: bigint
  ): Promise<ItauProposalDetails> {
    const data = itauResponse.data
    const financingValue = cleanMoney(proposal.financedValue)
    const propertyValue = cleanMoney(proposal.propertyValue)
    const ltv = (financingValue / propertyValue) * 100

    let statusMostData = {
      id_status_most: null as bigint | null,
      id_situacao_most: null as bigint | null
    }

    const statusGlobal = data.status_proposta?.global
    if (statusGlobal) {
      try {
        const ITAU_BANK_ID = 1
        const statusResult = await deParaRepository.findStatusByGlobalStatus(
          statusGlobal,
          ITAU_BANK_ID
        )
        statusMostData = {
          id_status_most: statusResult.id_status_most,
          id_situacao_most: statusResult.id_situacao_most
        }
      } catch (error) {
        console.warn(
          `⚠️ Não foi possível mapear status '${statusGlobal}' para o Itaú:`,
          error
        )
      }
    }

    return {
      id_proposta: data.id_proposta,
      decisao_credito: this.formatDateForDatabase(
        data.datas_proposta?.decisao_credito
      ),
      emissao_contrato: this.formatDateForDatabase(
        data.datas_proposta?.emissao_contrato
      ),
      assinatura_contrato: this.formatDateForDatabase(
        data.datas_proposta?.assinatura_contrato
      ),
      vencimento_credito: this.formatDateForDatabase(
        data.datas_proposta?.vencimento_credito
      ),
      liberacao_recurso: this.formatDateForDatabase(
        data.datas_proposta?.liberacao_recurso
      ),
      entrada_pasta: this.formatDateForDatabase(
        data.datas_proposta?.entrada_pasta
      ),
      status_global: data.status_proposta?.global || null,
      id_credito: data.status_proposta?.id_credito || null,
      descricao_credito: data.status_proposta?.descricao_credito || null,
      id_contratacao: data.status_proposta?.id_contratacao || null,
      descricao_contratacao:
        data.status_proposta?.descricao_contratacao || null,
      id_atividade: data.status_proposta?.id_atividade || null,
      prazo_aprovado: data.valores?.prazo_aprovado
        ? BigInt(data.valores.prazo_aprovado)
        : null,
      taxa_juros_anual: data.valores?.taxa_juros_anual || null,
      valor_itbi: data.valores?.valor_itbi || 0,
      valor_avaliacao: data.valores?.valor_avaliacao || 0,
      credito_aprovado: data.valores?.credito_aprovado || 0,
      agencia_numero: data.agencia_indicacao?.numero || null,
      agencia_funcional_gerente:
        data.agencia_indicacao?.funcional_gerente || null,
      id_cliente_most: clientMostId || null,
      ltv: ltv.toString(),
      prazo: data.valores?.prazo_solicitado
        ? BigInt(data.valores.prazo_solicitado)
        : null,
      cet: null,
      valor_solicitado: data.valores?.credito_solicitado || null,
      id_status_most: statusMostData.id_status_most || null,
      id_situacao_most: statusMostData.id_situacao_most || null,
      valor_fgts: data.valores?.valor_fgts || 0,
      valor_compra_venda: data.valores?.valor_compra_venda || null,
      valor_tarifas: data.valores?.valor_tarifas || 0,
      total_credito: data.valores?.total_credito || null,
      proposal_uuid: data.codigo_rastreio || null,
      id_produto: this.getProductId(data.produto)
    }
  }

  private static getProductId(produto: string): bigint {
    const productMap: { [key: string]: bigint } = {
      ISOLADO: BigInt(1),
      PILOTO: BigInt(2),
      REPASSE: BigInt(3),
      PORTABILIDADE: BigInt(4)
    }
    return productMap[produto] || BigInt(1)
  }

  static formatDateForDatabase(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null

    try {
      // Se a data estiver no formato YYYY/MM/DD, converter para YYYY-MM-DD
      if (dateStr.includes('/')) {
        const [year, month, day] = dateStr.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      return dateStr
    } catch (error) {
      console.warn('Erro ao formatar data:', dateStr, error)
      return null
    }
  }
}
