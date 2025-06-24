import { CreditSimulation } from '@domain/entities'
import { SantanderApiPayload } from '../types/santanderApiTypes'
import { produtoSantander } from 'Utils/dePara_Produto'
import { convertDateBrToIso } from 'Utils/convertData'

export class SantanderPayloadMapper {
  static convertToPayload(simulation: CreditSimulation): SantanderApiPayload {
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
          financingDeadlineInYears: financingDeadlineInYears,
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
            buyerBirthDate: buyerBirthDate
          }
        }
      },
      operationName: 'calculateSimulation'
    }
  }
}
