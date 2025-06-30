export interface SantanderApiPayload {
  query: string
  variables: {
    inputDataSimulation: {
      objFinancing: number
      financingAmount: number
      financingDeadlineInYears: number
      realtyAmount: number
      realtyType: string
      realtyUf: string
      utmSource: string
      nrPgCom: string
      userCode: string
      dataFirstBuyer: {
        buyerName: string
        buyerCpf: string
        buyerMobilePhone: string
        buyerEmail: string
        buyerIncome: number
        buyerBirthDate: string
      }
    }
  }
  operationName: string
}

export interface SantanderApiCustomPayload {
  simulationId: string
  flagFinancePropertyRegistrationAndITBI: boolean
  flagFinanceWarrantyEvaluationFee: boolean
  flagFinanceIOF: boolean
  insurerKey: string
  relationShipOfferKey: string
  amortizationTypeKey: string
  paymentTypeKey: string
  campaignKey: string
  segmentKey: string
  fgtsAmount: number
  flowType: string
  utmSource: string
  nrPgCom: string
  userCode: string
}
