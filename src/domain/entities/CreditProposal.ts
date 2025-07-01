export interface CreditProposal {
  // Controle de fluxo
  fluxo: 'normal' | 'reenvio' | 'adicionar-banco'
  consultorId: number
  userId?: number
  partnerId?: string

  // Bancos selecionados
  selectedBanks: string[] // ['itau', 'santander', 'bradesco', 'cef', 'inter']

  // Produto e parceiro
  selectedProductOption: string // ISOLADO, PILOTO, REPASSE, PORTABILIDADE
  selectedPartnerOption?: string

  // Dados do imóvel
  propertyValue: string // "R$ 400.000,00"
  financedValue: string // "R$ 200.000,00"
  term: string // "200"
  useFGTS: boolean
  fgtsValue?: string
  itbiPayment: boolean
  itbiValue?: string
  amortization: string // sac, price
  propertyType: string // residencial, comercial
  uf: string
  cities?: string
  situation: string // novo, usado
  financingRate: string // padrao, poupanca
  propertyTypeResidenceInfo?: string

  // Dados do cliente principal
  document: string // CPF formatado: "996.591.970-47"
  name: string
  birthday: string // "20/10/2000"
  phone: string // "(33) 17254-9801"
  email: string
  motherName: string
  gender: 'masculino' | 'feminino'
  documentType: string // rg, cnh, etc
  documentNumber: string
  documentIssuer: string // ssp, detran, etc
  documentIssueDate: string // "20/10/2000"
  ufDataUser: string
  monthlyIncome: string // "R$ 2.000,00"
  profession: string
  workType: string // assalariado, autonomo, etc
  professionalPosition: string
  maritalStatus: string // solteiro, casado, divorciado, viuvo
  matrimonialRegime?: string
  marriageDate?: string

  // Dados bancários
  cepBankAgency: string
  agencyBank?: string
  account?: string
  accountId?: string
  agency?: string

  // Endereço do usuário
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

  // Informações de segurança (bancos disponíveis)
  security?: {
    bank: Array<{
      name: string
      security: string
    }>
  }

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
    // Campos adicionais do endereço
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

    // Cônjuge do segundo proponente
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
}
