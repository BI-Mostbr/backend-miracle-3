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
import { cleanCpf, cleanMoney } from 'Utils/removeMasks'

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
          !!proposal.fgtsValue && cleanMoney(proposal.fgtsValue) > 0,
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
        fgtsAmount: cleanMoney(proposal.fgtsValue ?? '') ?? 0,
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
        'query calculateSimulation($inputDataSimulation : InputDataSimulation ){  calculateSimulation(inputDataSimulation: $inputDataSimulation){   simulationId    financingObjective    financingObjectiveKey    propertyValue    fgtsAmount    financingValue    financingDeadlineInYears    financingDeadlineInMonths    minimumFinancingDeadlineInMonths    maximumFinancingDeadlineInMonths  minFinancingAmount maxFinancingAmount  downPaymentAmount    expensesFinancedValue    iofValue    valuationFeeAmount    totalFinancingValueWithExpenses    trIndexer    customerPortfolioName    campaign    campaignKey    segment    segmentKey    relationShipOffer    relationShipOfferKey    insurer    insurerKey    amortizationType    amortizationTypeKey    paymentType    paymentTypeKey    allowsToFinanceWarrantyEvaluationFee    allowsToFinanceIOF    allowsToFinancePropertyRegistrationAndITBI    allowsFGTS    relationShipFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate      paymentPlan{        numberInstallment        amortizationDate        installmentValue        amortizationValue        interestAmount        insuranceValueDfi        insuranceValueMip        tariffValue        debitBalanceAmount      }    }    unrelatedFlow{      calculatedSimulationType      annualInterestRate      monthlyInterestRate      firstPaymentAmount      lastPaymentAmount      cetRate      ceshRate          }  }}',
      variables: {
        inputDataSimulation: {
          objFinancing: produto,
          financingAmount: Number(cleanMoney(proposal.financedValue)),
          financingDeadlineInYears,
          realtyAmount: Number(cleanMoney(proposal.propertyValue)),
          realtyType: residentialType,
          realtyUf: proposal.uf,
          utmSource: 'mostpp',
          nrPgCom: '20495',
          userCode: '204951587699',
          dataFirstBuyer: {
            buyerName: proposal.name,
            buyerCpf: cleanCpf(proposal.document),
            buyerMobilePhone:
              phoneRegexSantander(proposal.phone).ddd +
              phoneRegexSantander(proposal.phone).numero,
            buyerEmail: proposal.email,
            buyerIncome: cleanMoney(proposal.monthlyIncome),
            buyerBirthDate: buyerBirthDate
          },
          ...(secondBuyer && {
            dataSecondBuyer: {
              buyerName: secondBuyer.name,
              buyerCpf: cleanCpf(secondBuyer.document),
              buyerMobilePhone:
                phoneRegexSantander(secondBuyer.phone).ddd +
                phoneRegexSantander(secondBuyer.phone).numero,
              buyerEmail: secondBuyer.email,
              buyerIncome: cleanMoney(secondBuyer.monthlyIncome),
              buyerBirthDate: convertDateBrToIso(secondBuyer.birthday)
            }
          })
        }
      },
      operationName: 'calculateSimulation'
    }
  }
}
