// src/domain/services/CreditSimulationDomain.service.ts - VERSÃO CORRIGIDA
import { CreditSimulation } from '@domain/entities'
import { convertDateBrToIso } from 'Utils/convertData'

export class CreditSimulationDomainService {
  /**
   * Valida regras de negócio BÁSICAS e UNIVERSAIS
   * Regras específicas de bancos ficam no BankParameterNormalizer
   */
  static validateBusinessRules(simulation: CreditSimulation): boolean {
    try {
      // 1. Validação de CPF
      if (!this.isValidCPF(simulation.customerCpf)) {
        throw new Error('CPF inválido')
      }

      // 2. Validações básicas de valores
      if (simulation.propertyValue <= 0) {
        throw new Error('Valor do imóvel deve ser maior que zero')
      }

      if (simulation.financingValue <= 0) {
        throw new Error('Valor do financiamento deve ser maior que zero')
      }

      // 3. Validação básica de parcelas (limites muito amplos)
      if (simulation.installments < 1 || simulation.installments > 420) {
        throw new Error('Número de parcelas deve estar entre 1 e 420 meses')
      }

      // 4. Validação de entrada mínima (não pode financiar mais que o valor do imóvel)
      if (simulation.financingValue > simulation.propertyValue) {
        throw new Error(
          'Valor do financiamento não pode ser maior que o valor do imóvel'
        )
      }

      // 5. Validação de entrada mínima básica (pelo menos 1% de entrada)
      const downPayment = simulation.propertyValue - simulation.financingValue
      const minimumDownPayment = simulation.propertyValue * 0.01 // 1%

      if (downPayment < minimumDownPayment) {
        throw new Error(
          'Entrada mínima deve ser pelo menos 1% do valor do imóvel'
        )
      }

      // 6. Validação de LTV máximo universal (95% - muito permissivo)
      const ltv = (simulation.financingValue / simulation.propertyValue) * 100
      if (ltv > 95) {
        throw new Error('LTV não pode exceder 95% (entrada mínima de 5%)')
      }

      // 7. Validações de campos obrigatórios
      if (
        !simulation.customerName ||
        simulation.customerName.trim().length < 2
      ) {
        throw new Error(
          'Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres'
        )
      }

      if (!simulation.customerBirthDate) {
        throw new Error('Data de nascimento é obrigatória')
      }

      // 8. Validação de idade (entre 18 e 80 anos)
      if (!this.isValidAge(simulation.customerBirthDate)) {
        throw new Error('Cliente deve ter entre 18 e 80 anos')
      }

      return true
    } catch (error) {
      console.error('Validation error:', error)
      throw error // Re-lança o erro para que o caller possa tratá-lo
    }
  }

  /**
   * Valida se a idade está dentro dos limites aceitáveis
   */
  static isValidAge(birthDate: string): boolean {
    try {
      const birthDateRegex = convertDateBrToIso(birthDate)
      const birth = new Date(birthDateRegex)
      const today = new Date()
      const age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      // Ajusta se ainda não fez aniversário este ano
      const finalAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
          ? age - 1
          : age

      return finalAge >= 18 && finalAge <= 80
    } catch (error) {
      return false
    }
  }

  /**
   * Valida CPF usando algoritmo oficial
   */
  static isValidCPF(cpf: string): boolean {
    if (!cpf) return false

    const cleanCPF = cpf.replace(/\D/g, '')

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false
    }

    // Verifica se não são todos iguais (111.111.111-11, etc.)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return false
    }

    // Validação do primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    if (digit1 >= 10) digit1 = 0
    if (parseInt(cleanCPF.charAt(9)) !== digit1) {
      return false
    }

    // Validação do segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    if (digit2 >= 10) digit2 = 0

    return parseInt(cleanCPF.charAt(10)) === digit2
  }

  /**
   * Calcula o LTV (Loan to Value) em percentual
   */
  static calculateLTV(financingValue: number, propertyValue: number): number {
    if (propertyValue <= 0) return 0
    return (financingValue / propertyValue) * 100
  }

  /**
   * Calcula a entrada baseada no valor do imóvel e financiamento
   */
  static calculateDownPayment(
    propertyValue: number,
    financingValue: number
  ): number {
    return propertyValue - financingValue
  }

  /**
   * Valida se os valores estão dentro de limites razoáveis de mercado
   */
  static validateMarketLimits(simulation: CreditSimulation): boolean {
    // Valor do imóvel entre R$ 50.000 e R$ 50.000.000
    if (
      simulation.propertyValue < 50000 ||
      simulation.propertyValue > 50000000
    ) {
      throw new Error(
        'Valor do imóvel deve estar entre R$ 50.000 e R$ 50.000.000'
      )
    }

    // Valor do financiamento entre R$ 30.000 e R$ 30.000.000
    if (
      simulation.financingValue < 30000 ||
      simulation.financingValue > 30000000
    ) {
      throw new Error(
        'Valor do financiamento deve estar entre R$ 30.000 e R$ 30.000.000'
      )
    }

    return true
  }

  /**
   * Valida regras completas (básicas + mercado)
   */
  static validateComplete(simulation: CreditSimulation): boolean {
    return (
      this.validateBusinessRules(simulation) &&
      this.validateMarketLimits(simulation)
    )
  }
}
