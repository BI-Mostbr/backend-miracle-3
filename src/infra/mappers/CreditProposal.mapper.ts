import { CreditProposal } from '@domain/entities'
import { CreditProposalRequest } from '@infra/dtos/CreditProposal.dto'

export class CreditProposalMapper {
  static convertFromRequest(request: CreditProposalRequest): CreditProposal {
    // Helper para limpar valores monetários
    const cleanMoneyValue = (value: string): number => {
      return parseFloat(value.replace(/[R$\s.,]/g, '').replace(',', '.')) || 0
    }

    // Helper para limpar CPF
    const cleanCpf = (cpf: string): string => {
      return cpf.replace(/\D/g, '')
    }

    const proposal: CreditProposal = {
      // Controle de fluxo
      fluxo: request.fluxo,
      consultorId: request.consultorId,
      userId: request.userId,
      partnerId: request.partnerId,

      // Bancos selecionados
      selectedBanks: request.selectedBanks,

      // Produto e parceiro
      selectedProductOption: request.selectedProductOption,
      selectedPartnerOption: request.selectedPartnerOption,

      // Dados do imóvel
      propertyValue: request.propertyValue,
      financedValue: request.financedValue,
      term: request.term,
      useFGTS: request.useFGTS,
      fgtsValue: request.fgtsValue,
      itbiPayment: request.itbiPayment,
      itbiValue: request.itbiValue,
      amortization: request.amortization,
      propertyType: request.propertyType,
      uf: request.uf,
      cities: request.cities,
      situation: request.situation,
      financingRate: request.financingRate,
      propertyTypeResidenceInfo: request.propertyTypeResidenceInfo,

      // Dados do cliente principal
      document: request.document,
      name: request.name,
      birthday: request.birthday,
      phone: request.phone,
      email: request.email,
      motherName: request.motherName,
      gender: request.gender,
      documentType: request.documentType,
      documentNumber: request.documentNumber,
      documentIssuer: request.documentIssuer,
      documentIssueDate: request.documentIssueDate,
      ufDataUser: request.ufDataUser,
      monthlyIncome: request.monthlyIncome,
      profession: request.profession,
      workType: request.workType,
      professionalPosition: request.professionalPosition,
      maritalStatus: request.maritalStatus,
      matrimonialRegime: request.matrimonialRegime,
      marriageDate: request.marriageDate,

      // Dados bancários
      cepBankAgency: request.cepBankAgency,
      agencyBank: request.agencyBank,
      account: request.account,
      accountId: request.accountId,
      agency: request.agency,

      // Endereço do usuário
      userAddress: {
        cep: request.userAddress?.cep || request.cepBankAgency,
        logradouro: request.userAddress?.logradouro || '',
        complemento: request.userAddress?.complemento,
        unidade: request.userAddress?.unidade,
        bairro: request.userAddress?.bairro || '',
        localidade: request.userAddress?.localidade || request.cities || '',
        uf: request.userAddress?.uf || request.uf,
        estado: request.userAddress?.estado || '',
        regiao: request.userAddress?.regiao || '',
        ibge: request.userAddress?.ibge || '',
        gia: request.userAddress?.gia || '',
        ddd: request.userAddress?.ddd || '',
        siafi: request.userAddress?.siafi || '',
        number: request.userAddress?.number || '',
        complement: request.userAddress?.complement
      },

      // Informações de segurança (se fornecidas)
      security: request.security
    }

    // Adicionar cônjuge se existir e tiver dados válidos
    if (request.spouse && request.spouse.document && request.spouse.name) {
      proposal.spouse = {
        document: request.spouse.document,
        name: request.spouse.name,
        birthday: request.spouse.birthday,
        phone: request.spouse.phone,
        email: request.spouse.email,
        motherName: request.spouse.motherName,
        documentType: request.spouse.documentType,
        documentNumber: request.spouse.documentNumber,
        documentIssuer: request.spouse.documentIssuer,
        documentIssueDate: request.spouse.documentIssueDate,
        gender: request.spouse.gender,
        spouseUfDataUser: request.spouse.spouseUfDataUser,
        spouseContributesIncome: request.spouse.spouseContributesIncome,
        propertyType: request.spouse.propertyType,
        cep: request.spouse.cep,
        logradouro: request.spouse.logradouro,
        bairro: request.spouse.bairro,
        localidade: request.spouse.localidade,
        number: request.spouse.number,
        complement: request.spouse.complement,
        ufRedisence: request.spouse.ufRedisence,
        profession: request.spouse.profession,
        workType: request.spouse.workType,
        monthlyIncome: request.spouse.monthlyIncome,
        professionalPosition: request.spouse.professionalPosition,
        civilStatus: request.spouse.civilStatus,
        complemento: request.spouse.complemento,
        unidade: request.spouse.unidade,
        uf: request.spouse.uf,
        estado: request.spouse.estado,
        regiao: request.spouse.regiao,
        ibge: request.spouse.ibge,
        gia: request.spouse.gia,
        ddd: request.spouse.ddd,
        siafi: request.spouse.siafi
      }
    }

    // Adicionar segundo proponente se existir e tiver dados válidos
    if (
      request.secondProponent &&
      request.secondProponent.document &&
      request.secondProponent.name
    ) {
      proposal.secondProponent = {
        document: request.secondProponent.document,
        name: request.secondProponent.name,
        birthday: request.secondProponent.birthday,
        phone: request.secondProponent.phone,
        email: request.secondProponent.email,
        motherName: request.secondProponent.motherName,
        documentType: request.secondProponent.documentType,
        documentNumber: request.secondProponent.documentNumber,
        documentIssuer: request.secondProponent.documentIssuer,
        documentIssueDate: request.secondProponent.documentIssueDate,
        gender: request.secondProponent.gender,
        uf: request.secondProponent.uf,
        spouseContributesIncome:
          request.secondProponent.spouseContributesIncome,
        propertyType: request.secondProponent.propertyType,
        cep: request.secondProponent.cep,
        logradouro: request.secondProponent.logradouro,
        bairro: request.secondProponent.bairro,
        localidade: request.secondProponent.localidade,
        number: request.secondProponent.number,
        complement: request.secondProponent.complement,
        ufRedisence: request.secondProponent.ufRedisence,
        profession: request.secondProponent.profession,
        workType: request.secondProponent.workType,
        monthlyIncome: request.secondProponent.monthlyIncome,
        professionalPosition: request.secondProponent.professionalPosition,
        civilStatus: request.secondProponent.civilStatus
      }

      // Adicionar cônjuge do segundo proponente se existir
      if (
        request.secondProponent.spouseSecondProponent &&
        request.secondProponent.spouseSecondProponent.document
      ) {
        proposal.secondProponent.spouseSecondProponent =
          request.secondProponent.spouseSecondProponent
      }
    }

    // Adicionar dados de construção se necessário
    if (
      request.construction &&
      (proposal.selectedProductOption === 'PILOTO' ||
        proposal.selectedProductOption === 'REPASSE')
    ) {
      proposal.construction = {
        businessPersonId: request.construction.businessPersonId,
        enterpriseId: request.construction.enterpriseId,
        blockId: request.construction.blockId,
        unitId: request.construction.unitId
      }
    }

    // Adicionar dados de portabilidade se necessário
    if (
      request.portability &&
      proposal.selectedProductOption === 'PORTABILIDADE'
    ) {
      proposal.portability = {
        outstandingBalance: request.portability.outstandingBalance,
        remainingPeriod: request.portability.remainingPeriod,
        originalPeriod: request.portability.originalPeriod
      }
    }

    return proposal
  }

  // Métodos helper para converter dados formatados
  static getCleanCpf(proposal: CreditProposal): string {
    return proposal.document.replace(/\D/g, '')
  }

  static getCleanPhone(proposal: CreditProposal): string {
    return proposal.phone.replace(/\D/g, '')
  }

  static getPropertyValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.propertyValue) return 0

    // Corrigir a conversão: remover R$, espaços e pontos (separadores de milhar), depois trocar vírgula por ponto
    const cleanValue = proposal.propertyValue
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.') // Troca vírgula por ponto decimal

    return parseFloat(cleanValue) || 0
  }

  static getFinancedValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.financedValue) return 0

    // Mesma correção
    const cleanValue = proposal.financedValue
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.') // Troca vírgula por ponto decimal

    return parseFloat(cleanValue) || 0
  }

  static getMonthlyIncomeAsNumber(proposal: CreditProposal): number {
    if (!proposal.monthlyIncome) return 0

    // Mesma correção
    const cleanValue = proposal.monthlyIncome
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.') // Troca vírgula por ponto decimal

    return parseFloat(cleanValue) || 0
  }

  static getFgtsValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.fgtsValue) return 0

    // Mesma correção
    const cleanValue = proposal.fgtsValue
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.') // Troca vírgula por ponto decimal

    return parseFloat(cleanValue) || 0
  }

  static getItbiValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.itbiValue) return 0

    // Mesma correção
    const cleanValue = proposal.itbiValue
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.') // Troca vírgula por ponto decimal

    return parseFloat(cleanValue) || 0
  }

  static getTermAsNumber(proposal: CreditProposal): number {
    return parseInt(proposal.term) || 0
  }

  static getDownPayment(proposal: CreditProposal): number {
    return (
      this.getPropertyValueAsNumber(proposal) -
      this.getFinancedValueAsNumber(proposal)
    )
  }

  // Converter data brasileira para ISO
  static convertBirthdayToIso(birthday: string): string {
    const [day, month, year] = birthday.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  static parseMoneyString(value: string): number {
    if (!value) return 0
    const cleanValue = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')

    return parseFloat(cleanValue) || 0
  }
}
