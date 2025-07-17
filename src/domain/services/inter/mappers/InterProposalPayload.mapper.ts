import { CreditProposal } from '@domain/entities'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import {
  InterProposalPayload,
  InterProposalPerson
} from '../types/InterProposalPayload.type'

export class InterProposalPayloadMapper {
  static convertToPayload(proposal: CreditProposal): InterProposalPayload {
    const pessoas: InterProposalPerson[] = []

    pessoas.push({
      tipoPessoa: 'PRINCIPAL',
      cpf: CreditProposalMapper.getCleanCpf(proposal),
      nome: proposal.name,
      dtAniversario: this.formatDateForInter(proposal.birthday),
      telefone: proposal.phone.replace(/\D/g, ''),
      email: proposal.email,
      estadoCivil: this.mapMaritalStatus(proposal.maritalStatus),
      sexo: this.mapGender(proposal.gender),
      escolaridade: '8',
      profissao: this.mapProfession(proposal.profession),
      tipoRenda: this.mapIncomeType(proposal.workType),
      renda: CreditProposalMapper.getMonthlyIncomeAsNumber(proposal),
      endereco: {
        cep: proposal.userAddress?.cep?.replace(/\D/g, '') || '',
        descricao: proposal.userAddress?.logradouro || '',
        bairro: proposal.userAddress?.bairro || '',
        cidade: proposal.userAddress?.localidade || '',
        estado: proposal.userAddress?.uf || proposal.uf,
        numero: parseInt(proposal.userAddress?.number || '0'),
        complemento: proposal.userAddress?.complement || null
      },
      flagFiador: false,
      flagAdquirente: true,
      flagAnuente: false
    })

    if (this.hasValidSpouse(proposal)) {
      pessoas.push({
        tipoPessoa: 'CONJUGE',
        cpf: this.getCleanSpouseCpf(proposal),
        nome: proposal.spouse!.name,
        dtAniversario: this.formatDateForInter(proposal.spouse!.birthday),
        telefone:
          proposal.spouse!.phone?.replace(/\D/g, '') ||
          proposal.phone.replace(/\D/g, ''),
        email: proposal.spouse!.email || proposal.email,
        estadoCivil: this.mapMaritalStatus(proposal.maritalStatus),
        sexo: this.mapGender(proposal.spouse!.gender),
        escolaridade: '8',
        profissao: this.mapProfession(proposal.spouse!.profession),
        tipoRenda: this.mapIncomeType(proposal.spouse!.workType),
        renda: this.getSpouseIncome(proposal),
        endereco: {
          cep:
            proposal.spouse!.cep?.replace(/\D/g, '') ||
            proposal.userAddress?.cep?.replace(/\D/g, '') ||
            '',
          descricao:
            proposal.spouse!.logradouro ||
            proposal.userAddress?.logradouro ||
            '',
          bairro: proposal.spouse!.bairro || proposal.userAddress?.bairro || '',
          cidade:
            proposal.spouse!.localidade ||
            proposal.userAddress?.localidade ||
            '',
          estado:
            proposal.spouse!.ufRedisence ||
            proposal.userAddress?.uf ||
            proposal.uf,
          numero: parseInt(
            proposal.spouse!.number || proposal.userAddress?.number || '0'
          ),
          complemento:
            proposal.spouse!.complement ||
            proposal.userAddress?.complement ||
            null
        },
        flagFiador: false,
        flagAdquirente: proposal.spouse?.spouseContributesIncome || false,
        flagAnuente: false
      })
    }

    if (this.hasValidSecondProponent(proposal)) {
      pessoas.push({
        tipoPessoa: 'EXTRA',
        cpf: this.getCleanSecondProponentCpf(proposal),
        nome: proposal.secondProponent!.name,
        dtAniversario: this.formatDateForInter(
          proposal.secondProponent!.birthday
        ),
        telefone:
          proposal.secondProponent!.phone?.replace(/\D/g, '') ||
          proposal.phone.replace(/\D/g, ''),
        email: proposal.secondProponent!.email || proposal.email,
        estadoCivil: this.mapMaritalStatus(
          proposal.secondProponent!.civilStatus || proposal.maritalStatus
        ),
        sexo: this.mapGender(proposal.secondProponent!.gender),
        escolaridade: '8',
        profissao: this.mapProfession(proposal.secondProponent!.profession),
        tipoRenda: this.mapIncomeType(proposal.secondProponent!.workType),
        renda: this.getSecondProponentIncome(proposal),
        endereco: {
          cep:
            proposal.secondProponent!.cep?.replace(/\D/g, '') ||
            proposal.userAddress?.cep?.replace(/\D/g, '') ||
            '',
          descricao:
            proposal.secondProponent!.logradouro ||
            proposal.userAddress?.logradouro ||
            '',
          bairro:
            proposal.secondProponent!.bairro ||
            proposal.userAddress?.bairro ||
            '',
          cidade:
            proposal.secondProponent!.localidade ||
            proposal.userAddress?.localidade ||
            '',
          estado:
            proposal.secondProponent!.uf ||
            proposal.userAddress?.uf ||
            proposal.uf,
          numero: parseInt(
            proposal.secondProponent!.number ||
              proposal.userAddress?.number ||
              '0'
          ),
          complemento:
            proposal.secondProponent!.complement ||
            proposal.userAddress?.complement ||
            null
        },
        flagFiador: false,
        flagAdquirente:
          proposal.secondProponent?.spouseContributesIncome || false,
        flagAnuente: false
      })
    }

    return {
      tipoProduto: this.mapProductType(proposal.selectedProductOption),
      quantidadeParcelas: CreditProposalMapper.getTermAsNumber(proposal),
      valorSolicitado: CreditProposalMapper.getFinancedValueAsNumber(proposal),
      parceiro: 8249,
      imovel: {
        categoria: this.mapPropertyType(proposal.propertyType),
        valor: CreditProposalMapper.getPropertyValueAsNumber(proposal),
        endereco: {
          estado: proposal.uf,
          cidade: proposal.cities || proposal.userAddress?.localidade || ''
        }
      },
      pessoas: pessoas
    }
  }

  private static formatDateForInter(date: string): string {
    if (!date) return '01/01/2000'

    if (date.includes('/')) {
      return date
    }

    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return '01/01/2000'
      }

      const day = dateObj.getDate().toString().padStart(2, '0')
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
      const year = dateObj.getFullYear()

      return `${day}/${month}/${year}`
    } catch {
      return '01/01/2000'
    }
  }

  private static hasValidSpouse(proposal: CreditProposal): boolean {
    return !!(
      proposal.spouse &&
      proposal.spouse.document &&
      proposal.spouse.name &&
      proposal.maritalStatus.toLowerCase() !== 'solteiro'
    )
  }

  private static getCleanSpouseCpf(proposal: CreditProposal): string {
    return proposal.spouse?.document?.replace(/\D/g, '') || ''
  }

  private static getSpouseIncome(proposal: CreditProposal): number {
    if (!proposal.spouse?.monthlyIncome) return 0

    const income = proposal.spouse.monthlyIncome.toString()
    return (
      parseFloat(
        income.replace(/[R$\s.,]/g, '').replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private static mapMaritalStatus(maritalStatus: string): string {
    const statusMap: { [key: string]: string } = {
      solteiro: '1',
      casado: '2',
      divorciado: '3',
      viuvo: '4',
      'uniao estavel': '5',
      uniao_estavel: '5'
    }

    return statusMap[maritalStatus.toLowerCase()] || '1'
  }

  private static mapGender(gender: string): string {
    const genderMap: { [key: string]: string } = {
      masculino: '1',
      feminino: '2'
    }

    return genderMap[gender?.toLowerCase()] || '1'
  }

  private static mapProfession(profession?: string): string {
    const professionMap: { [key: string]: string } = {
      '853': '1001',
      engenheiro: '1001',
      advogado: '1002',
      medico: '1003',
      professor: '1004',
      administrador: '1005',
      contador: '1006',
      programador: '1007',
      arquiteto: '1008',
      vendedor: '1009',
      autonomo: '1010'
    }

    if (!profession) return '1001'
    return professionMap[profession.toLowerCase()] || '1001'
  }

  private static mapIncomeType(incomeType: string): string {
    const incomeMap: { [key: string]: string } = {
      assalariado: '1',
      autonomo: '2',
      empresario: '3',
      aposentado: '4',
      pensionista: '5',
      funcionario_publico: '6',
      'funcionario publico': '6'
    }

    return incomeMap[incomeType?.toLowerCase()] || '1'
  }

  private static mapProductType(productType: string): string {
    const productMap: { [key: string]: string } = {
      isolado: 'FINANCIAMENTO_IMOBILIARIO',
      ISOLADO: 'FINANCIAMENTO_IMOBILIARIO',
      piloto: 'FINANCIAMENTO_IMOBILIARIO',
      PILOTO: 'FINANCIAMENTO_IMOBILIARIO',
      repasse: 'FINANCIAMENTO_IMOBILIARIO',
      REPASSE: 'FINANCIAMENTO_IMOBILIARIO',
      portabilidade: 'PORTABILIDADE_CREDITO',
      PORTABILIDADE: 'PORTABILIDADE_CREDITO'
    }

    return productMap[productType?.trim()] || 'FINANCIAMENTO_IMOBILIARIO'
  }

  private static mapPropertyType(propertyType: string): string {
    const propertyMap: { [key: string]: string } = {
      residencial: 'CASA_RESIDENCIAL',
      casa: 'CASA_RESIDENCIAL',
      apartamento: 'APARTAMENTO_RESIDENCIAL',
      comercial: 'IMOVEL_COMERCIAL',
      terreno: 'TERRENO'
    }

    return propertyMap[propertyType?.toLowerCase()] || 'CASA_RESIDENCIAL'
  }

  private static getPartnerId(partnerId?: string): number {
    if (partnerId && !isNaN(parseInt(partnerId))) {
      return parseInt(partnerId)
    }

    return parseInt(process.env.INTER_PARTNER_ID || '1')
  }

  private static hasValidSecondProponent(proposal: CreditProposal): boolean {
    return !!(
      proposal.secondProponent &&
      proposal.secondProponent.document &&
      proposal.secondProponent.name
    )
  }

  private static getCleanSecondProponentCpf(proposal: CreditProposal): string {
    return proposal.secondProponent?.document?.replace(/\D/g, '') || ''
  }

  private static getSecondProponentIncome(proposal: CreditProposal): number {
    if (!proposal.secondProponent?.monthlyIncome) return 0

    const income = proposal.secondProponent.monthlyIncome.toString()
    return (
      parseFloat(
        income.replace(/[R$\s.,]/g, '').replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }
}
