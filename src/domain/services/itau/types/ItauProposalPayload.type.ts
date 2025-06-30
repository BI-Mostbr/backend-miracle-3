export interface ItauProposalPayload {
  productType: string
  indication?: {
    partner: {
      code: string
      cnpj: string
      agent: {
        name: string
        cpf: string
      }
    }
  }
  property: {
    type: string
    state: string
  }
  portability?: {
    amortizationType: string
    feeType: string
    insuranceType: string
    outstandingBalance: number
    propertyPrice: number
    remainingPeriod: number
    originalPeriod: number
  }
  financing?: {
    amortizationType: string
    financingValue: number
    downPayment: number
    itbiValue?: number
    includeRegistryCosts: boolean
    feeType: string
    propertyPrice: number
    period: number
    walletType: string
    insuranceType: string
  }
  construction?: {
    businessPersonId: string
    enterpriseId: string
    blockId?: string
    unitId?: string
    attachments?: Array<{
      attachmentId: string
      blockId: string
    }>
  }
  proponents: ItauProponent[]
}

export interface ItauProponent {
  email: string
  holder: boolean
  identification: {
    cpf: string
    name: string
    birthDate: string
    nationality?: string
  }
  occupation: {
    profession: string
    company?: string
    companyCnpj?: string
    admissionDate?: string
    incomeType: string
    incomeValue: number
  }
  relationship?: {
    maritalStatus: string
    liveTogether?: boolean
    composeIncome?: boolean
    spouse?: ItauSpouse
  }
  contacts: Array<{
    type: string
    content: string
    preference: boolean
  }>
  address: {
    type: string
    zipCode: string
    state: string
    city: string
    street: string
    number: string
    district: string
    complement?: string
  }
}

export interface ItauSpouse {
  email: string
  identification: {
    cpf: string
    name: string
    birthDate: string
    nationality?: string
  }
  occupation: {
    profession: string
    company?: string
    companyCnpj?: string
    admissionDate?: string
    incomeType: string
    incomeValue: number
  }
  address: {
    type: string
    zipCode: string
    state: string
    city: string
    street: string
    number: string
    district: string
    complement?: string
  }
  contacts: Array<{
    type: string
    content: string
    preference: boolean
  }>
}
