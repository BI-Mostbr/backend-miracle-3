import { InterValidationStrategy } from '@domain/validation/strategies/inter/InterValidationStrategy'
import { ItauValidationStrategy } from '@domain/validation/strategies/itau/ItauValidationStrategy'
import { IBankValidationStrategy } from '@infra/interfaces/IBankValidationStrategy.interface'

export class BankValidationFactory {
  private static strategies: Map<string, IBankValidationStrategy> = new Map()

  /**
   * Registra uma estratégia de validação
   */
  static registerStrategy(
    bankName: string,
    strategy: IBankValidationStrategy
  ): void {
    this.strategies.set(bankName.toLowerCase(), strategy)
    console.log(`📋 Estratégia registrada para ${bankName}`)
  }

  /**
   * Obtém estratégia de validação para um banco
   */
  static getStrategy(bankName: string): IBankValidationStrategy {
    const strategy = this.strategies.get(bankName.toLowerCase())

    if (!strategy) {
      throw new Error(
        `Estratégia de validação não encontrada para o banco: ${bankName}`
      )
    }

    return strategy
  }

  /**
   * Verifica se existe estratégia para um banco
   */
  static hasStrategy(bankName: string): boolean {
    return this.strategies.has(bankName.toLowerCase())
  }

  /**
   * Lista todos os bancos com estratégias registradas
   */
  static getAvailableBanks(): string[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * Obtém informações de todos os bancos
   */
  static getAllBankLimits(): { [bankName: string]: any } {
    const allLimits: { [bankName: string]: any } = {}

    this.strategies.forEach((strategy, bankName) => {
      allLimits[bankName] = {
        bankName: strategy.bankName,
        limits: strategy.limits,
        ltvMaximo: `${strategy.limits.ltv.max}%`,
        ltvMinimo: `${strategy.limits.ltv.min}%`,
        prazoMinimo: `${strategy.limits.term.min} meses`,
        prazoMaximo: `${strategy.limits.term.max} meses`,
        valorMinimoImovel: `R$ ${strategy.limits.propertyValue.min.toLocaleString()}`,
        valorMaximoImovel: strategy.limits.propertyValue.max
          ? `R$ ${strategy.limits.propertyValue.max.toLocaleString()}`
          : 'Sem limite',
        rendaMinima: strategy.limits.income?.min
          ? `R$ ${strategy.limits.income.min.toLocaleString()}`
          : 'Não especificada'
      }
    })

    return allLimits
  }

  /**
   * Remove estratégia de um banco
   */
  static removeStrategy(bankName: string): boolean {
    const removed = this.strategies.delete(bankName.toLowerCase())
    if (removed) {
      console.log(`🗑️ Estratégia removida para ${bankName}`)
    }
    return removed
  }

  /**
   * Limpa todas as estratégias
   */
  static clearAll(): void {
    this.strategies.clear()
    console.log('🗑️ Todas as estratégias foram removidas')
  }

  /**
   * Inicializa as estratégias padrão
   */
  static initializeDefaultStrategies(): void {
    console.log('🚀 Inicializando estratégias padrão...')

    // Registrar estratégias dos bancos
    this.registerStrategy('inter', new InterValidationStrategy())
    this.registerStrategy('itau', new ItauValidationStrategy())

    // Adicionar Santander quando implementado
    // this.registerStrategy('santander', new SantanderValidationStrategy())

    console.log(
      `✅ ${this.strategies.size} estratégia(s) inicializadas: ${this.getAvailableBanks().join(', ')}`
    )
  }

  /**
   * Cria instância singleton de uma estratégia
   */
  static getSingletonStrategy(bankName: string): IBankValidationStrategy {
    if (!this.hasStrategy(bankName)) {
      // Auto-registrar estratégias conhecidas
      switch (bankName.toLowerCase()) {
        case 'inter':
          this.registerStrategy('inter', new InterValidationStrategy())
          break
        case 'itau':
          this.registerStrategy('itau', new ItauValidationStrategy())
          break
        default:
          throw new Error(`Estratégia não implementada para ${bankName}`)
      }
    }

    return this.getStrategy(bankName)
  }

  /**
   * Valida se um banco específico está disponível
   */
  static validateBankAvailability(bankName: string): {
    available: boolean
    message: string
  } {
    const isAvailable = this.hasStrategy(bankName)

    return {
      available: isAvailable,
      message: isAvailable
        ? `${bankName} está disponível para validação`
        : `${bankName} não possui estratégia de validação implementada. Bancos disponíveis: ${this.getAvailableBanks().join(', ')}`
    }
  }

  /**
   * Obtém estatísticas das estratégias
   */
  static getStatistics(): {
    totalStrategies: number
    availableBanks: string[]
    averageLTV: number
    averageMinTerm: number
    averageMaxTerm: number
  } {
    const strategies = Array.from(this.strategies.values())

    const totalStrategies = strategies.length
    const availableBanks = this.getAvailableBanks()

    const averageLTV =
      strategies.reduce((sum, s) => sum + s.limits.ltv.max, 0) / totalStrategies
    const averageMinTerm =
      strategies.reduce((sum, s) => sum + s.limits.term.min, 0) /
      totalStrategies
    const averageMaxTerm =
      strategies.reduce((sum, s) => sum + s.limits.term.max, 0) /
      totalStrategies

    return {
      totalStrategies,
      availableBanks,
      averageLTV: Math.round(averageLTV),
      averageMinTerm: Math.round(averageMinTerm),
      averageMaxTerm: Math.round(averageMaxTerm)
    }
  }
}

// Auto-inicializar estratégias padrão
BankValidationFactory.initializeDefaultStrategies()
