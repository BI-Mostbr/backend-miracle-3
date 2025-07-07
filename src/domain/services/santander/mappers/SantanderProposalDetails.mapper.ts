import { CreditProposal } from '@domain/entities'
import { ISantanderProposalDetails } from '@infra/interfaces/SantanderProposalDetails.interface'
import { DeParaRepository } from '@infra/repositories/DePara.repository'
import { decryptJasypt } from 'Utils/crypto'
import { cleanMoney } from 'Utils/removeMasks'

export class SantanderProposalDetailsMapper {
  static async mapFromSantanderResponse(
    santanderResponse: any,
    proposal: CreditProposal,
    deParaRepository: DeParaRepository,
    clientMostId?: bigint
  ): Promise<ISantanderProposalDetails> {
    const data = santanderResponse.data
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
        const ITAU_BANK_ID = 2
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
          `Não foi possível mapear status '${statusGlobal}' para o Itaú:`,
          error
        )
      }
    }

    return {
      id_proposta: decryptJasypt(data.simulationId),
      id_simulacao: decryptJasypt(data.simulationId),
      id_cliente: clientMostId?.toString(),
      produto: this.mapProduct(data.financingObjectiveKey),
      id_produto: BigInt(data.financingObjectiveKey),
      valor_imovel: data.propertyValue,
      valor_fgts: data.fgtsAmount,
      prazo_anos: data.financingDeadlineInYears,
      prazo_meses: data.financingDeadlineInMonths,
      valor_financiamento_minimo: data.minFinancingAmount,
      valor_financiado_maximo: data.maxFinancingAmount,
      valor_entrada: data.downPaymentAmount,
      valor_despesas: data.expensesFinancedValue,
      valor_iof: data.iofValue,
      valuation_fee_amount: data.valuationFeeAmount,
      valor_financiamento_despesas: data.totalFinancingValueWithExpenses,
      indexador_tr: data.trIndexer,
      tipo_carteira: data.customerPortfolioName,
      campanha: data.campaign,
      id_campanha: data.campaignKey,
      segmento: data.segment,
      id_segmento: data.segmentKey,
      oferta_relacionamento: data.relationShipOffer,
      id_oferta_relacionamento: data.relationShipOfferKey,
      seguro: data.insurer,
      id_seguro: data.insurerKey,
      tipo_amortizacao: data.amortizationType,
      chave_tipo_amortizacao: data.amortizationTypeKey,
      tipo_pagamento: data.paymentType,
      chave_tipo_pagamento: data.paymentTypeKey,
      tipo_simulacao_calculada: data.unrelatedFlow.calculatedSimulationType,
      valor_juros_anual: data.unrelatedFlow.annualInterestRate,
      valor_juros_mensal: data.unrelatedFlow.monthlyInterestRate,
      valor_primeira_parcela: data.unrelatedFlow.firstPaymentAmount,
      valor_ultima_parcela: data.unrelatedFlow.lastPaymentAmount,
      valor_cet: data.unrelatedFlow.cetRate,
      valor_cesh: data.unrelatedFlow.ceshRate,
      situacao: 'teste',
      proposta_copiada: false,
      id_cliente_most: clientMostId || null,
      ltv: ltv.toString(),
      id_status_most: statusMostData.id_status_most || null,
      id_situacao_most: statusMostData.id_situacao_most || null
    }
  }

  private static mapProduct(produto: string): string {
    const productMap: { [key: string]: string } = {
      '3': 'Crédito',
      '49': 'Piloto',
      '4': 'CGI'
    }
    return productMap[produto]
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
