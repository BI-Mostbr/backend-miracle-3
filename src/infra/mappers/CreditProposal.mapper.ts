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
      // Dados do cliente principal
      customerCpf: cleanCpf(request.document),
      customerName: request.name,
      customerBirthDate: request.birthday,
      customerEmail: request.email,
      customerPhone: request.phone.replace(/\D/g, ''),
      customerMotherName: request.motherName,
      customerGender: request.gender,
      customerMaritalStatus: request.maritalStatus,
      customerProfession: request.profession,
      customerIncomeType: request.workType,
      customerIncome: cleanMoneyValue(request.monthlyIncome),
      customerWorkRegime: request.workType,

      // Documentos do cliente
      documentType: request.documentType,
      documentNumber: request.documentNumber,
      documentIssuer: request.documentIssuer,
      documentIssueDate: request.documentIssueDate,
      documentUf: request.ufDataUser,

      // Endereço do cliente
      customerAddress: {
        zipCode: request.cepBankAgency.replace(/\D/g, ''),
        street: '',
        number: '',
        neighborhood: '',
        city: request.cities || '',
        state: request.uf,
        addressType: 'RESIDENTIAL'
      },

      // Dados da proposta
      productType: request.selectedProductOption,
      propertyType: request.propertyType,
      propertyValue: cleanMoneyValue(request.propertyValue),
      financingValue: cleanMoneyValue(request.financedValue),
      downPayment:
        cleanMoneyValue(request.propertyValue) -
        cleanMoneyValue(request.financedValue),
      installments: parseInt(request.term),
      amortizationType: request.amortization.toUpperCase(),
      financingRate: request.financingRate,
      propertyState: request.uf,
      propertyCity: request.cities,
      useFgts: request.useFGTS,
      fgtsValue: request.fgtsValue ? cleanMoneyValue(request.fgtsValue) : 0,
      useItbi: request.itbiPayment,
      itbiValue: request.itbiValue ? cleanMoneyValue(request.itbiValue) : 0,

      // Controle de fluxo
      flowType: request.fluxo,
      userId: request.userId,
      consultorId: request.consultorId,
      partnerId: request.partnerId
    }

    // Adicionar cônjuge se existir
    if (request.spouse && request.spouse.document) {
      proposal.spouse = {
        cpf: cleanCpf(request.spouse.document),
        name: request.spouse.name,
        birthDate: request.spouse.birthday,
        email: request.spouse.email,
        phone: request.spouse.phone.replace(/\D/g, ''),
        motherName: request.spouse.motherName,
        gender: request.spouse.gender,
        profession: request.spouse.profession,
        incomeType: request.spouse.workType,
        income: cleanMoneyValue(request.spouse.monthlyIncome),
        workRegime: request.spouse.workType,
        composeIncome: request.spouse.spouseContributesIncome,

        documentType: request.spouse.documentType,
        documentNumber: request.spouse.documentNumber,
        documentIssuer: request.spouse.documentIssuer,
        documentIssueDate: request.spouse.documentIssueDate,
        documentUf: request.spouse.spouseUfDataUser,

        address: {
          zipCode: request.spouse.cep.replace(/\D/g, ''),
          street: request.spouse.logradouro,
          number: request.spouse.number,
          complement: request.spouse.complement,
          neighborhood: request.spouse.bairro,
          city: request.spouse.localidade,
          state: request.spouse.ufRedisence,
          addressType: 'RESIDENTIAL'
        }
      }
    }

    // Adicionar segundo proponente se existir e for diferente do cônjuge
    if (
      request.secondProponent &&
      request.secondProponent.document &&
      request.secondProponent.document !== request.spouse?.document
    ) {
      proposal.spouse = {
        cpf: cleanCpf(request.secondProponent.document),
        name: request.secondProponent.name,
        birthDate: request.secondProponent.birthday,
        email: request.secondProponent.email,
        phone: request.secondProponent.phone.replace(/\D/g, ''),
        motherName: request.secondProponent.motherName,
        gender: request.secondProponent.gender,
        profession: request.secondProponent.profession,
        incomeType: request.secondProponent.workType,
        income: cleanMoneyValue(request.secondProponent.monthlyIncome),
        workRegime: request.secondProponent.workType,
        composeIncome: request.secondProponent.spouseContributesIncome,

        documentType: request.secondProponent.documentType,
        documentNumber: request.secondProponent.documentNumber,
        documentIssuer: request.secondProponent.documentIssuer,
        documentIssueDate: request.secondProponent.documentIssueDate,
        documentUf: request.secondProponent.uf,

        address: {
          zipCode: request.secondProponent.cep.replace(/\D/g, ''),
          street: request.secondProponent.logradouro,
          number: request.secondProponent.number,
          complement: request.secondProponent.complement,
          neighborhood: request.secondProponent.bairro,
          city: request.secondProponent.localidade,
          state: request.secondProponent.ufRedisence,
          addressType: 'RESIDENTIAL'
        }
      }
    }

    // Adicionar dados de construção se necessário
    if (
      request.construction &&
      (proposal.productType === 'PILOTO' || proposal.productType === 'REPASSE')
    ) {
      proposal.construction = {
        businessPersonId: request.construction.businessPersonId,
        enterpriseId: request.construction.enterpriseId,
        blockId: request.construction.blockId,
        unitId: request.construction.unitId
      }
    }

    // Adicionar dados de portabilidade se necessário
    if (request.portability && proposal.productType === 'PORTABILIDADE') {
      proposal.portability = {
        outstandingBalance: request.portability.outstandingBalance,
        remainingPeriod: request.portability.remainingPeriod,
        originalPeriod: request.portability.originalPeriod
      }
    }

    return proposal
  }
}
