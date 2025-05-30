export interface ItauApiPayload {
  productType: string
  propertyType: string
  propertyPrice: number
  amortizationType: string
  feeType: string
  insuranceType: string
  period: number
  downPayment: number
  includeRegistryCosts: boolean
  registryCostsPercentage: number
  proponents: Array<{
    document: string
    birthDate: string
    income: number
    zipCode: string
    composeIncome: boolean
  }>
}
