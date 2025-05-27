import { CreditSimulation } from '@domain/entities'

export class CreditSimulationDomainService {
  static validateBusinessRules(simulation: CreditSimulation): boolean {
    if (!this.isValidCPF(simulation.customerCpf)) {
      throw new Error('Invalid CPF format')
    }

    if (simulation.propertyValue <= 0) {
      throw new Error('Property value must be greater than zero')
    }
    if (simulation.financingValue <= 0) {
      throw new Error('Financing value must be greater than zero')
    }
    if (simulation.installments < 60 || simulation.installments > 420) {
      throw new Error('Installments must be between 60 and 420 months')
    }
    const downPayment = simulation.propertyValue - simulation.financingValue
    if (downPayment < 0) {
      throw new Error('Financing value cannot exceed property value')
    }
    const ltv = (simulation.financingValue / simulation.propertyValue) * 100
    if (ltv > 80) {
      return false // LTV exceeds 80%, business rule not met
    }
    return true // All business rules met
  }
  catch(error: unknown) {
    return false
  }

  static isValidCPF(cpf: string): boolean {
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
}
