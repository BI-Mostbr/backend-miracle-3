import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { decryptJasypt } from 'Utils/crypto'

export class SantanderProposalResponseInternMapper {
  static convertToInternalResponse(
    simulationResponse: any
  ): BankProposalResponse {
    return {
      proposalId: decryptJasypt(simulationResponse.simulationId),
      bankName: 'Santander',
      proposalNumber: decryptJasypt(simulationResponse.simulationId),
      status:
        simulationResponse.data.status ||
        simulationResponse.status ||
        'ENVIADO',

      bankSpecificData: {
        santander: {
          simulationId: simulationResponse.simulationId,
          financingObjective: simulationResponse.financingObjective,
          financingObjectiveKey: simulationResponse.financingObjectiveKey,
          propertyValue: simulationResponse.propertyValue,
          fgtsAmount: simulationResponse.fgtsAmount,
          financingValue: simulationResponse.financingValue,
          financingDeadlineInYears: simulationResponse.financingDeadlineInYears,
          financingDeadlineInMonths:
            simulationResponse.financingDeadlineInMonths,
          minimumFinancingDeadlineInMonths:
            simulationResponse.minimumFinancingDeadlineInMonths,
          maximumFinancingDeadlineInMonths:
            simulationResponse.maximumFinancingDeadlineInMonths,
          minFinancingAmount: simulationResponse.minFinancingAmount,
          maxFinancingAmount: simulationResponse.maxFinancingAmount,
          downPaymentAmount: simulationResponse.downPaymentAmount,
          expensesFinancedValue: simulationResponse.expensesFinancedValue,
          iofValue: simulationResponse.iofValue,
          valuationFeeAmount: simulationResponse.valuationFeeAmount,
          totalFinancingValueWithExpenses:
            simulationResponse.totalFinancingValueWithExpenses,
          trIndexer: simulationResponse.trIndexer,
          customerPortfolioName: simulationResponse.customerPortfolioName,
          campaign: simulationResponse.campaign,
          campaignKey: simulationResponse.campaignKey,
          segment: simulationResponse.segment,
          segmentKey: simulationResponse.segmentKey,
          relationShipOffer: simulationResponse.relationShipOffer,
          relationShipOfferKey: simulationResponse.relationShipOfferKey,
          insurer: simulationResponse.insurer,
          insurerKey: simulationResponse.insurerKey,
          amortizationType: simulationResponse.amortizationType,
          amortizationTypeKey: simulationResponse.amortizationTypeKey,
          paymentType: simulationResponse.paymentType,
          paymentTypeKey: simulationResponse.paymentTypeKey,
          allowsToFinanceWarrantyEvaluationFee:
            simulationResponse.allowsToFinanceWarrantyEvaluationFee,
          allowsToFinanceIOF: simulationResponse.allowsToFinanceIOF,
          allowsToFinancePropertyRegistrationAndITBI:
            simulationResponse.allowsToFinancePropertyRegistrationAndITBI,
          allowsFGTS: simulationResponse.allowsFGTS,
          relationShipFlow: simulationResponse.relationShipFlow,
          unrelatedFlow: {
            calculatedSimulationType:
              simulationResponse.calculatedSimulationType,
            annualInterestRate: simulationResponse.annualInterestRate,
            monthlyInterestRate: simulationResponse.monthlyInterestRate,
            firstPaymentAmount: simulationResponse.firstPaymentAmount,
            lastPaymentAmount: simulationResponse.lastPaymentAmount,
            cetRate: simulationResponse.cetRate,
            ceshRate: simulationResponse.ceshRate
          }
        }
      }
    }
  }
}
