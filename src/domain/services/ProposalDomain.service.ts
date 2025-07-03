import { CreditProposal } from '@domain/entities'
import { convertDateBrToIso } from 'Utils/convertData'
import { cleanMoney, cleanCpf } from 'Utils/removeMasks'

export class ProposalDomainService {
  /**
   * Valida regras de negócio específicas para PROPOSTAS
   * (Diferentes das regras de simulação)
   */
  static validateBusinessRules(proposal: CreditProposal): boolean {
    try {
      console.log('🔍 Iniciando validação das regras de negócio da proposta...')

      // 1. Validação de CPF obrigatória
      const cleanedCpf = cleanCpf(proposal.document)
      if (!this.isValidCPF(cleanedCpf)) {
        throw new Error('CPF inválido para envio de proposta')
      }

      // 2. Validações de valores para proposta (mais rigorosas que simulação)
      const propertyValue = cleanMoney(proposal.propertyValue)
      const financedValue = cleanMoney(proposal.financedValue)

      if (propertyValue < 50000) {
        throw new Error('Valor mínimo do imóvel para proposta: R$ 50.000,00')
      }

      if (financedValue < 30000) {
        throw new Error(
          'Valor mínimo de financiamento para proposta: R$ 30.000,00'
        )
      }

      // 3. Validação de LTV para proposta (mais restritiva)
      const ltv = (financedValue / propertyValue) * 100
      if (ltv > 90) {
        throw new Error('LTV máximo para proposta: 90% (entrada mínima de 10%)')
      }

      if (ltv < 20) {
        throw new Error('LTV mínimo para proposta: 20%')
      }

      // 4. Validação de prazo para proposta
      const termNumber = parseInt(proposal.term)
      if (termNumber < 60) {
        throw new Error('Prazo mínimo para proposta: 60 meses')
      }

      if (termNumber > 420) {
        throw new Error('Prazo máximo para proposta: 420 meses')
      }

      // 5. Validações obrigatórias específicas para proposta
      if (!proposal.name || proposal.name.trim().length < 3) {
        throw new Error('Nome completo é obrigatório (mínimo 3 caracteres)')
      }

      if (!proposal.email || !this.isValidEmail(proposal.email)) {
        throw new Error('Email válido é obrigatório para proposta')
      }

      if (!proposal.phone || proposal.phone.replace(/\D/g, '').length < 10) {
        throw new Error('Telefone válido é obrigatório (mínimo 10 dígitos)')
      }

      if (!proposal.motherName || proposal.motherName.trim().length < 3) {
        throw new Error('Nome da mãe é obrigatório (mínimo 3 caracteres)')
      }

      // 6. Validação de idade para proposta
      if (!this.isValidAge(proposal.birthday)) {
        throw new Error('Cliente deve ter entre 18 e 75 anos para proposta')
      }

      // 9. Validações de documentação para proposta
      // if (!proposal.documentType || !proposal.documentNumber) {
      //   throw new Error('Tipo e número do documento são obrigatórios')
      // }

      // if (!proposal.documentIssuer || !proposal.documentIssueDate) {
      //   throw new Error('Órgão expedidor e data de emissão são obrigatórios')
      // }

      // 10. Validações de endereço para proposta
      // if (!proposal.userAddress || !proposal.userAddress.cep) {
      //   throw new Error('Endereço completo é obrigatório para proposta')
      // }

      // if (!proposal.uf || proposal.uf.length !== 2) {
      //   throw new Error('UF do imóvel é obrigatória')
      // }

      // if (!proposal.cities) {
      //   throw new Error('Cidade do imóvel é obrigatória')
      // }

      // 11. Validações específicas por produto
      this.validateByProduct(proposal)

      // 12. Validações de cônjuge (se aplicável)
      if (this.requiresSpouseData(proposal.maritalStatus) && !proposal.spouse) {
        throw new Error(
          'Dados do cônjuge são obrigatórios para estado civil informado'
        )
      }

      // 13. Validação de consultor (obrigatório para propostas)
      if (!proposal.consultorId) {
        throw new Error('Consultor é obrigatório para envio de proposta')
      }

      console.log(
        '✅ Validação das regras de negócio da proposta concluída com sucesso'
      )
      return true
    } catch (error) {
      console.error('❌ Erro na validação da proposta:', error)
      throw error
    }
  }

  /**
   * Validações específicas por tipo de produto
   */
  private static validateByProduct(proposal: CreditProposal): void {
    switch (proposal.selectedProductOption) {
      case 'PORTABILIDADE':
        if (!proposal.portability) {
          throw new Error('Dados de portabilidade são obrigatórios')
        }
        break

      case 'PILOTO':
      case 'REPASSE':
        if (!proposal.construction) {
          throw new Error(
            'Dados de construção são obrigatórios para produto na planta'
          )
        }
        break

      case 'ISOLADO':
        // Validações específicas para financiamento isolado
        if (proposal.situation === 'novo' && !proposal.construction) {
          // Para imóvel novo, pode precisar de alguns dados de construção
        }
        break
    }
  }

  /**
   * Verifica se é necessário dados do cônjuge
   */
  private static requiresSpouseData(maritalStatus: string): boolean {
    const statusThatRequireSpouse = ['casado', 'união estável']
    return statusThatRequireSpouse.includes(maritalStatus.toLowerCase())
  }

  /**
   * Calcula parcela estimada para validação de capacidade
   */
  private static calculateEstimatedInstallment(
    financedValue: number,
    termMonths: number
  ): number {
    // Taxa estimada de 12% ao ano para cálculo aproximado
    const monthlyRate = 0.12 / 12
    const installment =
      financedValue *
      ((monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1))
    return installment
  }

  /**
   * Validação de idade específica para propostas (mais restritiva)
   */
  private static isValidAge(birthDate: string): boolean {
    try {
      const birthDateIso = convertDateBrToIso(birthDate)
      const birth = new Date(birthDateIso)
      const today = new Date()
      const age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      const finalAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
          ? age - 1
          : age

      return finalAge >= 18 && finalAge <= 75 // Mais restritivo que simulação
    } catch (error) {
      return false
    }
  }

  /**
   * Validação de CPF
   */
  private static isValidCPF(cpf: string): boolean {
    if (!cpf) return false

    const cleanedCPF = cpf.replace(/\D/g, '')

    if (cleanedCPF.length !== 11) {
      return false
    }

    if (/^(\d)\1{10}$/.test(cleanedCPF)) {
      return false
    }

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (10 - i)
    }

    let digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) {
      digit = 0
    }

    if (digit !== parseInt(cleanedCPF.charAt(9))) {
      return false
    }

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (11 - i)
    }

    digit = 11 - (sum % 11)
    if (digit === 10 || digit === 11) {
      digit = 0
    }

    return digit === parseInt(cleanedCPF.charAt(10))
  }

  /**
   * Validação de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validação específica por banco (pode ser expandida)
   */
  static validateForBank(proposal: CreditProposal, bankName: string): boolean {
    if (!this.validateBusinessRules(proposal)) {
      return false
    }

    switch (bankName.toLowerCase()) {
      case 'itau':
        return this.validateForItau(proposal)
      case 'inter':
        return this.validateForInter(proposal)
      case 'santander':
        return this.validateForSantander(proposal)
      default:
        return true
    }
  }

  private static validateForItau(proposal: CreditProposal): boolean {
    const financedValue = cleanMoney(proposal.financedValue)
    const propertyValue = cleanMoney(proposal.propertyValue)
    const ltv = (financedValue / propertyValue) * 100

    if (proposal.propertyType === 'residencial' && ltv > 80) {
      throw new Error('Itaú: LTV máximo de 80% para imóveis residenciais')
    }

    if (financedValue < 98000) {
      throw new Error('Itaú: Valor mínimo de financiamento é R$ 98.000,00')
    }

    return true
  }

  private static validateForInter(proposal: CreditProposal): boolean {
    // Regras específicas do Inter
    return true
  }

  private static validateForSantander(proposal: CreditProposal): boolean {
    // Regras específicas do Santander
    return true
  }
}
