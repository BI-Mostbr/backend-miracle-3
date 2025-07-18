import { CreditProposal } from '@domain/entities'
import { ISantanderProposalDetails } from '@infra/interfaces/SantanderProposalDetails.interface'
import { DeParaRepository } from '@infra/repositories/DePara.repository'
import { decryptJasypt } from 'Utils/crypto'
import { cleanMoney } from 'Utils/removeMasks'

export class SantanderProposalDetailsMapper {
  private static safeBigInt(value: any): bigint | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    if (typeof value === 'bigint') {
      return value
    }

    try {
      const numValue =
        typeof value === 'string' ? parseInt(value, 10) : Number(value)
      if (isNaN(numValue)) {
        return null
      }
      return BigInt(numValue)
    } catch (error) {
      console.warn('Erro ao converter para BigInt:', value, error)
      return null
    }
  }

  private static safeBigIntWithDefault(
    value: any,
    defaultValue: bigint
  ): bigint {
    const result = this.safeBigInt(value)
    return result !== null ? result : defaultValue
  }

  private static safeString(value: any): string | null {
    if (value === null || value === undefined) {
      return null
    }
    return String(value)
  }

  static async mapFromSantanderResponse(
    santanderResponse: any,
    proposal: CreditProposal,
    clientMostId?: bigint
  ): Promise<ISantanderProposalDetails> {
    const simulationData = santanderResponse.bankSpecificData?.santander || {}
    const analyzeData = santanderResponse.data?.analyzeCredit || {}
    const simulationId =
      santanderResponse.simulationId || simulationData.simulationId
    const financingObjectiveKey = simulationData.financingObjectiveKey || '3'
    const financingValue = cleanMoney(proposal.financedValue)
    const propertyValue = cleanMoney(proposal.propertyValue)
    const ltv = (financingValue / propertyValue) * 100

    let statusMostData = {
      id_status_most: null as bigint | null,
      id_situacao_most: null as bigint | null
    }

    return {
      id_proposta: simulationId
        ? decryptJasypt(simulationId)
        : analyzeData.garraProposal || null,
      id_simulacao: simulationId ? decryptJasypt(simulationId) : null,
      id_cliente: clientMostId?.toString(),
      produto: this.mapProduct(financingObjectiveKey),
      id_produto: this.safeBigIntWithDefault(financingObjectiveKey, BigInt(3)),
      valor_imovel: simulationData.propertyValue || propertyValue,
      valor_fgts: simulationData.fgtsAmount || 0,
      prazo_anos: this.safeBigInt(simulationData.financingDeadlineInYears),
      prazo_meses: this.safeBigInt(simulationData.financingDeadlineInMonths),
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
      id_campanha: this.safeString(simulationData.campaignKey),
      segmento: simulationData.segment || null,
      id_segmento: this.safeString(simulationData.segmentKey),
      oferta_relacionamento: simulationData.relationShipOffer || null,
      id_oferta_relacionamento: this.safeString(
        simulationData.relationShipOfferKey
      ),
      seguro: simulationData.insurer || null,
      id_seguro: this.safeString(simulationData.insurerKey),
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
      situacao: santanderResponse.status || 'ENVIADO',
      ltv: ltv.toString(),
      valor_financiado: financingValue,
      id_cliente_most: clientMostId,
      id_status_most: BigInt(1),
      id_situacao_most: this.safeBigIntWithDefault(
        this.mapSituacao(santanderResponse.status),
        BigInt(1)
      ),
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
      id_cliente_incorporador: this.safeBigInt(null)
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

  private static mapSituacao(returnCode: string): number {
    const situacaoMap: { [key: string]: number } = {
      REPROVADO: 2,
      PENDENTE: 3,
      APROVADO: 1,
      'APROVADO A MENOR': 7,
      CANCELADO: 5,
      'EM VALIDAÇÃO': 3
    }
    return situacaoMap[returnCode] || 1
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
