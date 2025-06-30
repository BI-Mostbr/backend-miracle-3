export interface CreditProposal {
  // Dados do cliente principal
  customerCpf: string
  customerName: string
  customerBirthDate: string
  customerEmail: string
  customerPhone: string
  customerMotherName: string
  customerGender: string
  customerMaritalStatus: string
  customerEducation?: string
  customerProfession: string
  customerIncomeType: string
  customerIncome: number
  customerWorkRegime: string

  // Documentos do cliente
  documentType: string
  documentNumber: string
  documentIssuer: string
  documentIssueDate: string
  documentUf: string

  // Endereço do cliente
  customerAddress: {
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    addressType: string
  }

  // Dados do cônjuge/segundo proponente (opcional)
  spouse?: {
    cpf: string
    name: string
    birthDate: string
    email: string
    phone: string
    motherName: string
    gender: string
    education?: string
    profession: string
    incomeType: string
    income: number
    workRegime: string
    composeIncome: boolean

    // Documentos do cônjuge
    documentType: string
    documentNumber: string
    documentIssuer: string
    documentIssueDate: string
    documentUf: string

    // Endereço do cônjuge
    address: {
      zipCode: string
      street: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      addressType: string
    }
  }

  // Dados da proposta
  productType: string // ISOLADO, PILOTO, REPASSE, PORTABILIDADE
  propertyType: string
  propertyValue: number
  financingValue: number
  downPayment: number
  installments: number
  amortizationType: string
  financingRate: string
  propertyState: string
  propertyCity?: string
  useFgts: boolean
  fgtsValue?: number
  useItbi: boolean
  itbiValue?: number

  // Dados específicos para construção (PILOTO/REPASSE)
  construction?: {
    businessPersonId: string
    enterpriseId: string
    blockId?: string
    unitId?: string
  }

  // Dados específicos para portabilidade
  portability?: {
    outstandingBalance: number
    remainingPeriod: number
    originalPeriod: number
  }

  // Controle de fluxo
  flowType: 'normal' | 'reenvio' | 'adicionar-banco'
  userId: number
  consultorId?: number
  partnerId?: string
}
