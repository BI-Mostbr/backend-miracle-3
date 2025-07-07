export interface BankProposalResponse {
  proposalId: string
  simulationId?: string
  bankName: string
  proposalNumber?: string
  status: string

  // Dados específicos por banco
  bankSpecificData?: {
    itau?: {
      proposalNumber: string
      proposalId: string
    }
    inter?: {
      idProposta: string
      idSimulacao: string
    }
    santander?: {
      simulationId: string
      financingObjective: string
      financingObjectiveKey: string
      propertyValue: number
      fgtsAmount: number
      financingValue: number
      financingDeadlineInYears: number
      financingDeadlineInMonths: number
      minimumFinancingDeadlineInMonths: number
      maximumFinancingDeadlineInMonths: number
      minFinancingAmount: number
      maxFinancingAmount: number
      downPaymentAmount: number
      expensesFinancedValue: number
      iofValue: number
      valuationFeeAmount: number
      totalFinancingValueWithExpenses: number
      trIndexer: string
      customerPortfolioName: string
      campaign: string
      campaignKey: string
      segment: string
      segmentKey: string
      relationShipOffer: string
      relationShipOfferKey: string
      insurer: string
      insurerKey: string
      amortizationType: string
      amortizationTypeKey: string
      paymentType: string
      paymentTypeKey: string
      allowsToFinanceWarrantyEvaluationFee: boolean
      allowsToFinanceIOF: boolean
      allowsToFinancePropertyRegistrationAndITBI: boolean
      allowsFGTS: boolean
      relationShipFlow: null | any
      unrelatedFlow: {
        calculatedSimulationType: string
        annualInterestRate: number
        monthlyInterestRate: number
        firstPaymentAmount: number
        lastPaymentAmount: number
        cetRate: number
        ceshRate: number
      }
    }
  }
}
