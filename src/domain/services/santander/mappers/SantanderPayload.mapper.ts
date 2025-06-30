import { CreditSimulation } from '@domain/entities'
import {
  SantanderApiCustomPayload,
  SantanderApiPayload
} from '../types/santanderApiTypes'
import { produtoSantander } from 'Utils/mapToProduct'
import { convertDateBrToIso } from 'Utils/convertData'

export class SantanderPayloadMapper {
  static convertToPayload(
    simulation: CreditSimulation,
    simulationCustom: false
  ): SantanderApiPayload
  static convertToPayload(
    simulation: string,
    simulationCustom: true
  ): SantanderApiCustomPayload

  // Implementação principal
  static convertToPayload(
    simulation: CreditSimulation | string,
    simulationCustom: boolean
  ): SantanderApiPayload | SantanderApiCustomPayload {
    if (simulationCustom) {
      if (typeof simulation === 'string') {
        return {
          simulationId: simulation,
          flagFinancePropertyRegistrationAndITBI: false,
          flagFinanceWarrantyEvaluationFee: false,
          flagFinanceIOF: false,
          insurerKey: '81112',
          relationShipOfferKey: '0',
          amortizationTypeKey: 'PREF_P',
          paymentTypeKey: 'PREF_P',
          campaignKey: '0',
          segmentKey: '5',
          fgtsAmount: 0,
          flowType: 'S',
          utmSource: 'mostpp',
          nrPgCom: '20495',
          userCode: '204951587699'
        }
      } else {
        throw new Error('Custom simulation precisa de um simulationId.')
      }
    }

    if (typeof simulation !== 'string') {
      const produto = produtoSantander(simulation.productType)
      const financingDeadlineInYears = Math.floor(simulation.installments / 12)
      const buyerBirthDate = convertDateBrToIso(simulation.customerBirthDate)

      return {
        query:
          'query calculateSimulation($inputDataSimulation : InputDataSimulation ){  calculateSimulation(inputDataSimulation: $inputDataSimulation){   simulationId    financingObjective    financingObjectiveKey    propertyValue    fgtsAmount    financingValue    financingDeadlineInYears    financingDeadlineInMonths    minimumFinancingDeadlineInMonths    maximumFinancingDeadlineInMonths  minFinancingAmount maxFinancingAmount  downPaymentAmount    expensesFinancedValue    iofValue    valuationFeeAmount    totalFinancingValueWithExpenses    trIndexer    customerPortfolioName    campaign    campaignKey    segment    segmentKey    relationShipOffer    relationShipOfferKey    insurer    insurerKey    amortizationType    amortizationTypeKey    paymentType    paymentTypeKey    allowsToFinanceWarrantyEvaluationFee    allowsToFinanceIOF    allowsToFinancePropertyRegistrationAndITBI    allowsFGTS    relationShipFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate      paymentPlan{        numberInstallment        amortizationDate        installmentValue        amortizationValue        interestAmount        insuranceValueDfi        insuranceValueMip        tariffValue        debitBalanceAmount      }    }    unrelatedFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate      paymentPlan{        numberInstallment        amortizationDate        installmentValue        amortizationValue        interestAmount        insuranceValueDfi        insuranceValueMip        tariffValue        debitBalanceAmount      }    }  }}',
        variables: {
          inputDataSimulation: {
            objFinancing: produto,
            financingAmount: simulation.financingValue,
            financingDeadlineInYears,
            realtyAmount: simulation.propertyValue,
            realtyType: 'R',
            realtyUf: 'SP',
            utmSource: 'mostpp',
            nrPgCom: '20495',
            userCode: '204951587699',
            dataFirstBuyer: {
              buyerName: simulation.customerName,
              buyerCpf: simulation.customerCpf,
              buyerMobilePhone: '11999999999',
              buyerEmail: 'bi@mostbr.com',
              buyerIncome: 2500000,
              buyerBirthDate
            }
          }
        },
        operationName: 'calculateSimulation'
      }
    } else {
      throw new Error(
        'A simulação padrão necessita de um tipo simulation para realizar a requisição.'
      )
    }
  }
}
