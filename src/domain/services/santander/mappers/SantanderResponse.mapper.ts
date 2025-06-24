import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { convertDateBrToIso } from 'Utils/convertData'
import { decryptJasypt } from 'Utils/crypto'

export class SantanderResponseMapper {
  static convertToInternApiResponse(
    santanderResponse: any,
    simulation: CreditSimulation
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
      propertyValue: simulation.propertyValue,
      downPayment: simulation.propertyValue - simulation.financingValue,
      amortizationType: simulation.amortizationType || 'SAC',
      ltv: (simulation.financingValue / simulation.propertyValue) * 100,
      bankSpecificData: {
        santander: {
          id_santander_decript: decryptJasypt(santanderResponse.simulationId),
          produto:
            simulation.productType === 'REPASSE'
              ? 'ISOLADO'
              : simulation.productType,
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
          nome: simulation.customerName,
          tipo_imovel: simulation.propertyType,
          cpf: simulation.customerCpf,
          celular: '11999999999',
          renda: 2500000,
          dt_nascimento: convertDateBrToIso(simulation.customerBirthDate),
          id_usuario: simulation.userId.toString()
        }
      }
    }
  }
}
