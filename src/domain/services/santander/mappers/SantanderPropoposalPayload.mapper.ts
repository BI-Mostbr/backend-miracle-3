import { CreditProposal } from '@domain/entities'
import {
  SantanderApiCustomPayload,
  SantanderApiPayload
} from '../types/santanderApiTypes'
import { produtoSantander } from 'Utils/mapToProduct'
import { convertDateBrToIso } from 'Utils/convertData'
import { mapToPropertyTypeSantander } from 'Utils/mapToProperty'
import { mapToAmortizationTypeSantander } from 'Utils/mapToAmortizationType'
import { phoneRegexSantander } from 'Utils/phoneRegex'

export class SantanderProposalPayloadMapper {
  static convertToPayload(
    proposal: CreditProposal,
    proposalCustom: false
  ): SantanderApiPayload
  static convertToPayload(
    proposal: CreditProposal,
    proposalCustom: true,
    proposalId: string
  ): SantanderApiCustomPayload

  // Implementação principal
  static convertToPayload(
    proposal: CreditProposal,
    proposalCustom: boolean,
    proposalId?: string
  ): SantanderApiPayload | SantanderApiCustomPayload {
    if (proposalCustom) {
      if (!proposalId) {
        throw new Error('O envio de proposta custom precisa de um proposalId.')
      }
      return {
        simulationId: proposalId,
        flagFinancePropertyRegistrationAndITBI:
          !!proposal.fgtsValue && Number(proposal.fgtsValue) > 0,
        flagFinanceWarrantyEvaluationFee: false,
        flagFinanceIOF: false,
        insurerKey: '81112',
        relationShipOfferKey: '0',
        amortizationTypeKey: mapToAmortizationTypeSantander(
          proposal.amortization
        ),
        paymentTypeKey: mapToAmortizationTypeSantander(proposal.amortization),
        campaignKey: '0',
        segmentKey: '5',
        fgtsAmount: Number(proposal.fgtsValue) ?? 0,
        flowType: 'S',
        utmSource: 'mostpp',
        nrPgCom: '20495',
        userCode: '204951587699'
      }
    }
    const produto = produtoSantander(proposal.selectedProductOption)
    const financingDeadlineInYears = Math.floor(Number(proposal.term) / 12)
    const buyerBirthDate = convertDateBrToIso(proposal.birthday)
    const residentialType = mapToPropertyTypeSantander(proposal.propertyType)
    const secondBuyer = proposal.spouse || proposal.secondProponent

    return {
      query:
        'query calculateSimulation($inputDataSimulation : InputDataSimulation ){  calculateSimulation(inputDataSimulation: $inputDataSimulation){   simulationId    financingObjective    financingObjectiveKey    propertyValue    fgtsAmount    financingValue    financingDeadlineInYears    financingDeadlineInMonths    minimumFinancingDeadlineInMonths    maximumFinancingDeadlineInMonths  minFinancingAmount maxFinancingAmount  downPaymentAmount    expensesFinancedValue    iofValue    valuationFeeAmount    totalFinancingValueWithExpenses    trIndexer    customerPortfolioName    campaign    campaignKey    segment    segmentKey    relationShipOffer    relationShipOfferKey    insurer    insurerKey    amortizationType    amortizationTypeKey    paymentType    paymentTypeKey    allowsToFinanceWarrantyEvaluationFee    allowsToFinanceIOF    allowsToFinancePropertyRegistrationAndITBI    allowsFGTS    relationShipFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate      paymentPlan{        numberInstallment        amortizationDate        installmentValue        amortizationValue        interestAmount        insuranceValueDfi        insuranceValueMip        tariffValue        debitBalanceAmount      }    }    unrelatedFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate      paymentPlan{        numberInstallment        amortizationDate        installmentValue        amortizationValue        interestAmount        insuranceValueDfi        insuranceValueMip        tariffValue        debitBalanceAmount      }    }  }}',
      variables: {
        inputDataSimulation: {
          objFinancing: produto,
          financingAmount: Number(proposal.financedValue),
          financingDeadlineInYears,
          realtyAmount: Number(proposal.propertyValue),
          realtyType: residentialType,
          realtyUf: proposal.uf,
          utmSource: 'mostpp',
          nrPgCom: '20495',
          userCode: '204951587699',
          dataFirstBuyer: {
            buyerName: proposal.name,
            buyerCpf: proposal.documentNumber,
            buyerMobilePhone:
              phoneRegexSantander(proposal.phone).ddd +
              phoneRegexSantander(proposal.phone).numero,
            buyerEmail: proposal.email,
            buyerIncome: Number(proposal.monthlyIncome),
            buyerBirthDate: buyerBirthDate
          },
          ...(secondBuyer && {
            dataSecondBuyer: {
              buyerName: secondBuyer.name,
              buyerCpf: secondBuyer.document,
              buyerMobilePhone: secondBuyer.phone,
              buyerEmail: secondBuyer.email,
              buyerIncome: secondBuyer.monthlyIncome,
              buyerBirthDate: convertDateBrToIso(secondBuyer.birthday)
            }
          })
        }
      },
      operationName: 'calculateSimulation'
    }
  }
}
