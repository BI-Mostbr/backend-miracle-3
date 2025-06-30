export interface CreditProposalRequest {
  // Fluxo de controle
  fluxo: 'normal' | 'reenvio' | 'adicionar-banco'
  selectedBanks: string[] // ['itau', 'inter', 'santander']

  // Produto selecionado
  selectedProductOption: string // ISOLADO, PILOTO, REPASSE, PORTABILIDADE

  // Dados do imóvel
  propertyValue: string
  financedValue: string
  term: string
  useFGTS: boolean
  fgtsValue?: string
  itbiPayment: boolean
  itbiValue?: string
  amortization: string
  propertyType: string
  uf: string
  cities?: string
  situation: string
  financingRate: string

  // Dados do cliente principal
  document: string
  name: string
  birthday: string
  phone: string
  email: string
  motherName: string
  gender: string
  documentType: string
  documentNumber: string
  documentIssuer: string
  documentIssueDate: string
  ufDataUser: string
  monthlyIncome: string
  profession: string
  workType: string
  professionalPosition: string
  maritalStatus: string
  matrimonialRegime?: string
  marriageDate?: string

  // Endereço do cliente
  propertyTypeResidenceInfo?: string
  cepBankAgency: string
  agencyBank?: string
  account?: string
  accountId?: string
  agency?: string

  // Dados do cônjuge
  spouse?: {
    document: string
    name: string
    birthday: string
    phone: string
    email: string
    motherName: string
    documentType: string
    documentNumber: string
    documentIssuer: string
    documentIssueDate: string
    gender: string
    spouseUfDataUser: string
    spouseContributesIncome: boolean
    propertyType: string
    cep: string
    logradouro: string
    bairro: string
    localidade: string
    number: string
    complement: string
    ufRedisence: string
    profession: string
    workType: string
    monthlyIncome: string
    professionalPosition: string
    civilStatus: string
  }

  // Segundo proponente
  secondProponent?: {
    document: string
    name: string
    birthday: string
    phone: string
    email: string
    motherName: string
    documentType: string
    documentNumber: string
    documentIssuer: string
    documentIssueDate: string
    gender: string
    uf: string
    spouseContributesIncome: boolean
    propertyType: string
    cep: string
    logradouro: string
    bairro: string
    localidade: string
    number: string
    complement: string
    ufRedisence: string
    profession: string
    workType: string
    monthlyIncome: string
    professionalPosition: string
    civilStatus: string
  }

  // Dados específicos para construção
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

  // IDs de controle
  userId: number
  consultorId?: number
  partnerId?: string
}

export interface CreditProposalResponse {
  success: boolean
  results: {
    [bankName: string]: {
      success: boolean
      proposalId?: string
      proposalNumber?: string
      error?: string
    }
  }
  clientId?: bigint
  timestamp: string
}
