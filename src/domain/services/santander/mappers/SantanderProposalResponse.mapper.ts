import { BankResponseSimulation, CreditProposal } from '@domain/entities'
import { convertDateBrToIso } from 'Utils/convertData'
import { decryptJasypt } from 'Utils/crypto'

export class SantanderResponseMapper {
  static convertToInternApiResponse(
    santanderResponse: any,
    proposal: CreditProposal
  ): BankResponseSimulation {
    return {
      simulationId: santanderResponse.simulationId,
      bankName: 'Santander',
      financingValue: santanderResponse.financingValue || 0,
      installments: santanderResponse.financingDeadlineInMonths || 0,
      firstInstallment: santanderResponse.unrelatedFlow.firstPaymentAmount || 0,
      lastInstallment: santanderResponse.unrelatedFlow.lastPaymentAmount || 0,
      interestRate: santanderResponse.unrelatedFlow.annualInterestRate || 0,
      cet: santanderResponse.unrelatedFlow.cetRate || 0,
      propertyValue: Number(proposal.propertyValue),
      downPayment:
        Number(proposal.propertyValue) - Number(proposal.financedValue),
      amortizationType: proposal.amortization || 'SAC',
      ltv:
        (Number(proposal.financedValue) / Number(proposal.propertyValue)) * 100,
      bankSpecificData: {
        santander: {
          id_santander_decript: decryptJasypt(santanderResponse.proposalId),
          produto:
            proposal.selectedProductOption === 'REPASSE'
              ? 'ISOLADO'
              : proposal.selectedProductOption,
          fgts: 0,
          prazo_anos: santanderResponse.financingDeadlineInYears,
          valor_minimo_solicitado: santanderResponse.minFinancingAmount,
          valor_maximo_solicitado: santanderResponse.maxFinancingAmount,
          valor_custas: 0,
          valor_iof: 0,
          valor_financiamento_custas:
            santanderResponse.totalFinancingValueWithExpenses,
          index_tr: santanderResponse.trIndexer,
          tipo_carteira: santanderResponse.customerPortfolioName,
          campanha: santanderResponse.campaign,
          key_campanha: santanderResponse.campaignKey,
          segmento: santanderResponse.segment,
          key_segmento: santanderResponse.segmentKey,
          relacionamento_banco: santanderResponse.relationShipOffer,
          key_relacionamento_banco: santanderResponse.relationShipOfferKey,
          seguro: santanderResponse.insurer,
          key_seguro: santanderResponse.insurerKey,
          amortizacao: santanderResponse.amortizationType,
          key_amortizacao: santanderResponse.amortizationTypeKey,
          tipo_pagamento: santanderResponse.paymentType,
          key_tipo_pagamento: santanderResponse.paymentTypeKey,
          tipo_simulacao:
            santanderResponse.unrelatedFlow.calculatedSimulationType,
          taxa_juros_mensal:
            santanderResponse.unrelatedFlow.monthlyInterestRate,
          primeira_parcela: santanderResponse.unrelatedFlow.firstPaymentAmount,
          ultima_parcela: santanderResponse.unrelatedFlow.lastPaymentAmount,
          cesh: santanderResponse.unrelatedFlow.cetRate,
          nome: proposal.name,
          tipo_imovel: proposal.propertyType,
          cpf: proposal.document,
          celular: proposal.phone,
          renda: Number(proposal.monthlyIncome),
          dt_nascimento: convertDateBrToIso(proposal.birthday),
          id_usuario: proposal.userId?.toString(),
          erro_valor_solicitado:
            santanderResponse.errors[0].extensions.messages[1].message || null
        }
      }
    }
  }
}
