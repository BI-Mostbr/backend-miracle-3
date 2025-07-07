export interface CreditProposal {
  fluxo: 'normal' | 'reenvio' | 'adicionar-banco'
  consultorId: number
  userId?: number
  partnerId?: string
  selectedBanks: string[]
  selectedProductOption: string
  selectedPartnerOption?: string
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
  propertyTypeResidenceInfo?: string
  document: string
  name: string
  birthday: string
  phone: string
  email: string
  motherName: string
  gender: 'masculino' | 'feminino'
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
  cepBankAgency: string
  agencyBank?: string
  account?: string
  accountId?: string
  agency?: string
  userAddress: {
    cep: string
    logradouro: string
    complemento?: string
    unidade?: string
    bairro: string
    localidade: string
    uf: string
    estado: string
    regiao: string
    ibge: string
    gia: string
    ddd: string
    siafi: string
    number: string
    complement?: string
  }

  security?: {
    bank: Array<{
      name: string
      security: string
    }>
  }

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
    gender: 'masculino' | 'feminino'
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
    complemento?: string
    unidade?: string
    uf: string
    estado: string
    regiao: string
    ibge: string
    gia: string
    ddd: string
    siafi: string
  }

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
    gender: 'masculino' | 'feminino'
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
    spouseSecondProponent?: {
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
      gender: 'masculino' | 'feminino'
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
      includesIncome: boolean
    }
  }

  construction?: {
    businessPersonId: string
    enterpriseId: string
    blockId?: string
    unitId?: string
  }

  portability?: {
    outstandingBalance: number
    remainingPeriod: number
    originalPeriod: number
  }
}
