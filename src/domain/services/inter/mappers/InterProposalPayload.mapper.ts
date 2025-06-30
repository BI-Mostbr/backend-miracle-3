import { CreditProposal } from '@domain/entities'
import { mapToPropertyTypeInter } from 'Utils/mapToProperty'
import { productInter } from 'Utils/mapToProduct'
import {
  InterProposalPayload,
  InterProposalPerson
} from '../types/InterProposalPayload.type'

export class InterProposalPayloadMapper {
  static convertToPayload(proposal: CreditProposal): InterProposalPayload {
    const propertyType = mapToPropertyTypeInter(proposal.propertyType)
    const product = productInter(proposal.productType)

    const pessoas: InterProposalPerson[] = []

    // Adicionar proponente principal
    pessoas.push({
      tipoPessoa: 'PRINCIPAL',
      cpf: proposal.customerCpf,
      nome: proposal.customerName,
      dtAniversario: proposal.customerBirthDate,
      telefone: proposal.customerPhone,
      email: proposal.customerEmail,
      estadoCivil: this.mapMaritalStatus(proposal.customerMaritalStatus),
      sexo: this.mapGender(proposal.customerGender),
      escolaridade: this.mapEducation(proposal.customerEducation),
      profissao: this.mapProfession(proposal.customerProfession),
      tipoRenda: this.mapIncomeType(proposal.customerIncomeType),
      renda: proposal.customerIncome,
      endereco: {
        cep: proposal.customerAddress.zipCode,
        descricao: proposal.customerAddress.street,
        bairro: proposal.customerAddress.neighborhood,
        cidade: proposal.customerAddress.city,
        estado: proposal.customerAddress.state,
        numero: parseInt(proposal.customerAddress.number || '0'),
        complemento: proposal.customerAddress.complement
      },
      flagFiador: false,
      flagAdquirente: true,
      flagAnuente: false
    })

    // Adicionar cônjuge se existir
    if (proposal.spouse) {
      pessoas.push({
        tipoPessoa: 'CONJUGE',
        cpf: proposal.spouse.cpf,
        nome: proposal.spouse.name,
        dtAniversario: proposal.spouse.birthDate,
        telefone: proposal.spouse.phone,
        email: proposal.spouse.email,
        estadoCivil: this.mapMaritalStatus(proposal.customerMaritalStatus),
        sexo: this.mapGender(proposal.spouse.gender),
        escolaridade: this.mapEducation(proposal.spouse.education),
        profissao: this.mapProfession(proposal.spouse.profession),
        tipoRenda: this.mapIncomeType(proposal.spouse.incomeType),
        renda: proposal.spouse.income,
        endereco: {
          cep: proposal.spouse.address.zipCode,
          descricao: proposal.spouse.address.street,
          bairro: proposal.spouse.address.neighborhood,
          cidade: proposal.spouse.address.city,
          estado: proposal.spouse.address.state,
          numero: parseInt(proposal.spouse.address.number || '0'),
          complemento: proposal.spouse.address.complement
        },
        flagFiador: false,
        flagAdquirente: proposal.spouse.composeIncome,
        flagAnuente: false
      })
    }

    return {
      tipoProduto: product,
      quantidadeParcelas: proposal.installments,
      valorSolicitado: proposal.financingValue,
      parceiro: this.getPartnerId(proposal.partnerId),
      imovel: {
        categoria: propertyType,
        valor: proposal.propertyValue,
        endereco: {
          estado: proposal.propertyState,
          cidade: proposal.propertyCity || proposal.customerAddress.city
        }
      },
      pessoas: pessoas
    }
  }

  private static mapMaritalStatus(maritalStatus: string): string {
    const statusMap: { [key: string]: string } = {
      solteiro: '1',
      casado: '2',
      divorciado: '3',
      viuvo: '4',
      uniao_estavel: '5'
    }

    return statusMap[maritalStatus.toLowerCase()] || '1'
  }

  private static mapGender(gender: string): string {
    const genderMap: { [key: string]: string } = {
      masculino: '1',
      feminino: '2'
    }

    return genderMap[gender.toLowerCase()] || '1'
  }

  private static mapEducation(education?: string): string {
    const educationMap: { [key: string]: string } = {
      fundamental_incompleto: '1',
      fundamental_completo: '2',
      medio_incompleto: '3',
      medio_completo: '4',
      superior_incompleto: '5',
      superior_completo: '6',
      pos_graduacao: '7',
      mestrado: '8',
      doutorado: '9'
    }

    return educationMap[education?.toLowerCase() || ''] || '4' // Padrão: médio completo
  }

  private static mapProfession(profession: string): string {
    // Mapeamento básico de profissões para códigos do Inter
    const professionMap: { [key: string]: string } = {
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

    return professionMap[profession.toLowerCase()] || '1001' // Padrão genérico
  }

  private static mapIncomeType(incomeType: string): string {
    const incomeMap: { [key: string]: string } = {
      assalariado: '1',
      autonomo: '2',
      empresario: '3',
      aposentado: '4',
      pensionista: '5',
      funcionario_publico: '6'
    }

    return incomeMap[incomeType.toLowerCase()] || '1'
  }

  private static getPartnerId(partnerId?: string): number {
    // Converter o partnerId string para número
    // Se não fornecido, usar ID padrão do parceiro
    if (partnerId && !isNaN(parseInt(partnerId))) {
      return parseInt(partnerId)
    }

    return parseInt(process.env.INTER_PARTNER_ID || '1')
  }
}
