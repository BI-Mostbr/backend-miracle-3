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
    console.log(
      '🔍 Debug santanderResponse structure:',
      JSON.stringify(santanderResponse, null, 2)
    )

    // ACESSAR OS DADOS CORRETOS
    const simulationData = santanderResponse.bankSpecificData?.santander || {}
    const analyzeData = santanderResponse.data?.analyzeCredit || {}

    // USAR O SIMULATION ID DO BANK RESPONSE PRINCIPAL
    const simulationId =
      santanderResponse.simulationId || simulationData.simulationId
    const financingObjectiveKey = simulationData.financingObjectiveKey || '3'

    console.log('🔍 simulationId:', simulationId)
    console.log('🔍 financingObjectiveKey:', financingObjectiveKey)

    const financingValue = cleanMoney(proposal.financedValue)
    const propertyValue = cleanMoney(proposal.propertyValue)
    const ltv = (financingValue / propertyValue) * 100

    let statusMostData = {
      id_status_most: null as bigint | null,
      id_situacao_most: null as bigint | null
    }

    const statusGlobal = this.mapStatusGlobal(analyzeData.returnCode)
    if (statusGlobal) {
      try {
        const SANTANDER_BANK_ID = 2
        const statusResult = await deParaRepository.findStatusByGlobalStatus(
          statusGlobal,
          SANTANDER_BANK_ID
        )
        statusMostData = {
          id_status_most: statusResult.id_status_most,
          id_situacao_most: statusResult.id_situacao_most
        }
      } catch (error) {
        console.warn(
          `Não foi possível mapear status '${statusGlobal}' para o Santander:`,
          error
        )
      }
    }

    return {
      id_proposta: simulationId
        ? decryptJasypt(simulationId)
        : analyzeData.garraProposal || null,
      id_simulacao: simulationId ? decryptJasypt(simulationId) : null,
      id_cliente: clientMostId?.toString(),
      produto: this.mapProduct(financingObjectiveKey),
      id_produto: financingObjectiveKey
        ? BigInt(financingObjectiveKey)
        : BigInt(3),

      // USAR DADOS DA SIMULAÇÃO ORIGINAL QUANDO DISPONÍVEIS
      valor_imovel: simulationData.propertyValue || propertyValue,
      valor_fgts: simulationData.fgtsAmount || 0,
      prazo_anos: simulationData.financingDeadlineInYears
        ? BigInt(simulationData.financingDeadlineInYears)
        : null,
      prazo_meses: simulationData.financingDeadlineInMonths
        ? BigInt(simulationData.financingDeadlineInMonths)
        : null,
      valor_financiamento_minimo: simulationData.minFinancingAmount || 0,
      valor_financiado_maximo: simulationData.maxFinancingAmount || 0,
      valor_entrada:
        simulationData.downPaymentAmount || propertyValue - financingValue,
      valor_despesas: simulationData.expensesFinancedValue || 0,
      valor_iof: simulationData.iofValue || 0,
      valuation_fee_amount: simulationData.valuationFeeAmount || 0,
      valor_financiamento_despesas:
        simulationData.totalFinancingValueWithExpenses || 0,
      indexador_tr: simulationData.trIndexer || 'TR',
      tipo_carteira: simulationData.customerPortfolioName || null,
      campanha: simulationData.campaign || null,
      id_campanha: simulationData.campaignKey || null,
      segmento: simulationData.segment || null,
      id_segmento: simulationData.segmentKey || null,
      oferta_relacionamento: simulationData.relationShipOffer || null,
      id_oferta_relacionamento: simulationData.relationShipOfferKey || null,
      seguro: simulationData.insurer || null,
      id_seguro: simulationData.insurerKey || null,
      tipo_amortizacao: simulationData.amortizationType || null,
      chave_tipo_amortizacao: simulationData.amortizationTypeKey || null,
      tipo_pagamento: simulationData.paymentType || null,
      chave_tipo_pagamento: simulationData.paymentTypeKey || null,
      tipo_simulacao_calculada:
        simulationData.unrelatedFlow?.calculatedSimulationType || null,
      valor_juros_anual:
        simulationData.unrelatedFlow?.annualInterestRate || null,
      valor_juros_mensal:
        simulationData.unrelatedFlow?.monthlyInterestRate || null,
      valor_primeira_parcela:
        simulationData.unrelatedFlow?.firstPaymentAmount || null,
      valor_ultima_parcela:
        simulationData.unrelatedFlow?.lastPaymentAmount || null,
      valor_cet: simulationData.unrelatedFlow?.cetRate || null,
      valor_cesh: simulationData.unrelatedFlow?.ceshRate || null,

      // STATUS BASEADO NO ANALYZE CREDIT
      situacao: this.mapSituacao(analyzeData.returnCode) || 'ENVIADO',
      status_global: statusGlobal || 'ENVIADO',

      // OUTROS CAMPOS
      ltv: ltv.toString(),
      valor_financiado: financingValue,
      id_cliente_most: clientMostId,
      id_status_most: statusMostData.id_status_most,
      id_situacao_most: statusMostData.id_situacao_most,
      id_substatus_most: null,
      status_simulation: null,
      status_creditAnalysis: null,
      status_informationRegister: null,
      status_documentSubmission: null,
      status_inspection: null,
      status_documentAnalysis: null,
      status_currentAccount: null,
      status_interveningPayer: null,
      status_dataAndValueVerification: null,
      status_fgts: null,
      status_printingAndSignature: null,
      status_signatureCheck: null,
      status_contractSubmission: null,
      status_releaseOfFunds: null,
      taxa_juros_percent:
        simulationData.unrelatedFlow?.annualInterestRate || null,
      total_documentos: null,
      proposta_copiada: false,
      id_cliente_incorporador: null
    }
  }

  private static mapProduct(financingObjectiveKey: string): string {
    const productMap: { [key: string]: string } = {
      '1': 'ISOLADO',
      '2': 'PILOTO',
      '3': 'REPASSE',
      '4': 'PORTABILIDADE'
    }
    return productMap[financingObjectiveKey] || 'ISOLADO'
  }

  private static mapSituacao(returnCode: string): string {
    const situacaoMap: { [key: string]: string } = {
      '200': 'REPROVADO',
      '301': 'PENDENTE',
      '000': 'APROVADO'
    }
    return situacaoMap[returnCode] || 'ENVIADO'
  }

  private static mapStatusGlobal(returnCode: string): string {
    const statusMap: { [key: string]: string } = {
      '200': 'REPROVADO',
      '301': 'EM_ANALISE',
      '000': 'APROVADO'
    }
    return statusMap[returnCode] || 'ENVIADO'
  }
}
