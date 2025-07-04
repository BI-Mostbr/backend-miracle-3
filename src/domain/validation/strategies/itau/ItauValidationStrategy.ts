import { CreditProposal } from '@domain/entities'
import { BaseBankValidationStrategy } from '../base/BaseBankValidationStrategy'
import {
  BankLimits,
  ValidationResult
} from '@infra/interfaces/IBankValidationStrategy.interface'

export class ItauValidationStrategy extends BaseBankValidationStrategy {
  public readonly bankName = 'Itaú'

  public readonly limits: BankLimits = {
    ltv: {
      min: 0,
      max: 80, // LTV máximo 80% para imóveis residenciais
      propertyTypes: ['residencial', 'casa', 'apartamento']
    },
    term: {
      min: 12, // Prazo mínimo 12 meses
      max: 420 // Prazo máximo 420 meses (35 anos)
    },
    propertyValue: {
      min: 50000, // Valor mínimo R$ 50.000
      max: undefined // Sem limite máximo
    },
    income: {
      min: 2000, // Renda mínima R$ 2.000
      multiplier: 6 // Até 6x a renda
    }
  }

  protected validateCustomRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    console.log('🔍 Aplicando regras específicas do Itaú...')

    // Regra 1: Validar score de crédito (simulado)
    this.validateCreditScore(proposal, result)

    // Regra 2: Validar relacionamento bancário
    this.validateBankRelationship(proposal, result)

    // Regra 3: Validar documentação necessária
    this.validateDocumentation(proposal, result)

    // Regra 4: Validar compatibilidade produto vs perfil
    this.validateProductCompatibility(proposal, result)
  }

  protected adjustCustomFields(proposal: CreditProposal): void {
    console.log('🔧 Aplicando ajustes específicos do Itaú...')

    // Ajuste específico: Clientes Itaú podem ter condições melhores
    this.adjustForBankClients(proposal)

    // Ajuste por produto
    this.adjustByProductType(proposal)
  }

  protected canAdjustCustomField(
    proposal: CreditProposal,
    field: string
  ): boolean {
    switch (field) {
      case 'productType':
        return true // Produto pode ser sugerido/ajustado
      case 'bankRelationship':
        return false // Relacionamento bancário não pode ser alterado
      default:
        return false
    }
  }

  // ========== REGRAS ESPECÍFICAS DO ITAÚ ==========

  private validateCreditScore(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // Simulação de score baseado na renda e valor financiado
    const income = this.getMonthlyIncomeAsNumber(proposal)
    const financedValue = this.getFinancedValueAsNumber(proposal)

    const incomeToFinancingRatio = financedValue / (income * 12) // Relação valor/renda anual

    if (incomeToFinancingRatio > 8) {
      // Mais de 8x renda anual
      result.warnings.push({
        code: 'HIGH_FINANCING_RATIO',
        field: 'creditAnalysis',
        message:
          'Relação financiamento/renda pode necessitar análise adicional no Itaú',
        recommendation:
          'Considere reduzir o valor financiado ou aumentar entrada'
      })
    }

    // Simulação baseada no tipo de trabalho
    if (proposal.workType?.toLowerCase() === 'autonomo') {
      result.warnings.push({
        code: 'AUTONOMOUS_WORKER',
        field: 'workType',
        message:
          'Trabalhadores autônomos precisam de documentação adicional no Itaú',
        recommendation: 'Prepare comprovação de renda dos últimos 24 meses'
      })
    }
  }

  private validateBankRelationship(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // Verificar se tem conta no Itaú (simulado através do agencyBank)
    const hasItauAccount = proposal.agencyBank && proposal.agencyBank.length > 0

    if (!hasItauAccount) {
      result.warnings.push({
        code: 'NO_BANK_RELATIONSHIP',
        field: 'bankRelationship',
        message:
          'Clientes sem relacionamento no Itaú podem ter condições diferentes',
        recommendation: 'Considere abrir conta corrente para melhores condições'
      })
    } else {
      // Cliente Itaú pode ter vantagens
      result.warnings.push({
        code: 'EXISTING_CLIENT_BENEFITS',
        field: 'bankRelationship',
        message: 'Cliente Itaú pode ter condições especiais',
        recommendation: 'Aproveite os benefícios de relacionamento'
      })
    }
  }

  private validateDocumentation(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // Validar documentos básicos
    if (!proposal.documentType || !proposal.documentNumber) {
      result.errors.push({
        code: 'MISSING_DOCUMENTS',
        field: 'documentation',
        message: 'Documentação básica incompleta',
        severity: 'blocking'
      })
    }

    // Validar situação específica por estado civil
    if (
      proposal.maritalStatus?.toLowerCase() === 'casado' &&
      !proposal.spouse?.document
    ) {
      result.warnings.push({
        code: 'SPOUSE_DOCUMENTATION',
        field: 'spouse',
        message: 'Documentação do cônjuge será necessária',
        recommendation: 'Prepare documentos do cônjuge para análise'
      })
    }
  }

  private validateProductCompatibility(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    const propertyValue = this.getPropertyValueAsNumber(proposal)
    const productType = proposal.selectedProductOption?.toLowerCase()

    // Regras por produto
    switch (productType) {
      case 'portabilidade':
        this.validatePortabilityRules(proposal, result)
        break
      case 'piloto':
      case 'repasse':
        this.validateConstructionRules(proposal, result)
        break
      case 'isolado':
        // Produto padrão, sem regras específicas
        break
      default:
        result.warnings.push({
          code: 'PRODUCT_TYPE_REVIEW',
          field: 'productType',
          message: 'Tipo de produto não especificado, será definido na análise',
          recommendation: 'Especifique o tipo de financiamento desejado'
        })
    }

    // Valores muito altos podem precisar de aprovação especial
    if (propertyValue > 2000000) {
      // R$ 2 milhões
      result.warnings.push({
        code: 'HIGH_VALUE_PROPERTY',
        field: 'propertyValue',
        message:
          'Imóveis de alto valor necessitam aprovação em comitê especial',
        recommendation: 'Processo pode levar mais tempo'
      })
    }
  }

  private validatePortabilityRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // Portabilidade tem regras específicas
    if (!proposal.portability?.outstandingBalance) {
      result.warnings.push({
        code: 'PORTABILITY_INFO_NEEDED',
        field: 'portability',
        message: 'Informações do financiamento atual são necessárias',
        recommendation: 'Forneça saldo devedor e condições atuais'
      })
    }
  }

  private validateConstructionRules(
    proposal: CreditProposal,
    result: ValidationResult
  ): void {
    // Piloto/Repasse tem regras específicas
    if (!proposal.construction?.businessPersonId) {
      result.warnings.push({
        code: 'CONSTRUCTION_INFO_NEEDED',
        field: 'construction',
        message: 'Informações da construtora/incorporadora são necessárias',
        recommendation: 'Forneça dados da empresa responsável'
      })
    }
  }

  private adjustForBankClients(proposal: CreditProposal): void {
    // Clientes Itaú podem ter LTV ligeiramente maior
    const hasItauAccount = proposal.agencyBank && proposal.agencyBank.length > 0

    if (hasItauAccount) {
      const currentLTV = this.calculateLTV(proposal)
      const maxLTVForClient = 82 // 2% a mais para clientes

      if (currentLTV > this.limits.ltv.max && currentLTV <= maxLTVForClient) {
        // Permitir LTV um pouco maior para clientes
        console.log(
          `🔧 Cliente Itaú: Permitindo LTV de ${currentLTV.toFixed(2)}% (limite especial)`
        )
        return // Não ajustar
      }
    }
  }

  private adjustByProductType(proposal: CreditProposal): void {
    const productType = proposal.selectedProductOption?.toLowerCase()

    // Ajustes específicos por produto
    switch (productType) {
      case 'portabilidade':
        // Portabilidade pode ter prazo maior
        if (this.getTermAsNumber(proposal) > this.limits.term.max) {
          proposal.term = '480' // 40 anos para portabilidade
          console.log('🔧 Prazo ajustado para portabilidade: 480 meses')
        }
        break

      case 'construcao':
        // Construção tem LTV menor
        const constructionMaxLTV = 70
        const currentLTV = this.calculateLTV(proposal)

        if (currentLTV > constructionMaxLTV) {
          const propertyValue = this.getPropertyValueAsNumber(proposal)
          const newFinancedValue = (propertyValue * constructionMaxLTV) / 100
          proposal.financedValue = this.formatCurrency(newFinancedValue)
          console.log(`🔧 LTV ajustado para construção: ${constructionMaxLTV}%`)
        }
        break
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  private getMonthlyIncomeAsNumber(proposal: CreditProposal): number {
    if (!proposal.monthlyIncome) return 0
    return (
      parseFloat(
        proposal.monthlyIncome
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private getFinancedValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.financedValue) return 0
    return (
      parseFloat(
        proposal.financedValue
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private getPropertyValueAsNumber(proposal: CreditProposal): number {
    if (!proposal.propertyValue) return 0
    return (
      parseFloat(
        proposal.propertyValue
          .replace(/[R$\s.,]/g, '')
          .replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
  }

  private getTermAsNumber(proposal: CreditProposal): number {
    return parseInt(proposal.term || '0')
  }

  // ========== MÉTODOS PÚBLICOS ESPECÍFICOS DO ITAÚ ==========

  /**
   * Verifica se o cliente tem relacionamento bancário
   */
  public hasExistingRelationship(proposal: CreditProposal): boolean {
    return !!(proposal.agencyBank && proposal.agencyBank.length > 0)
  }

  /**
   * Retorna condições especiais para clientes
   */
  public getClientBenefits(proposal: CreditProposal): string[] {
    const benefits: string[] = []

    if (this.hasExistingRelationship(proposal)) {
      benefits.push('LTV até 82% para clientes')
      benefits.push('Taxa preferencial')
      benefits.push('Análise prioritária')
      benefits.push('Dispensa algumas tarifas')
    }

    return benefits
  }

  /**
   * Calcula o prazo ideal baseado na renda
   */
  public calculateIdealTerm(proposal: CreditProposal): number {
    const income = this.getMonthlyIncomeAsNumber(proposal)
    const financedValue = this.getFinancedValueAsNumber(proposal)

    // Regra: parcela não deve exceder 30% da renda
    const maxInstallment = income * 0.3

    // Simulação simples de juros (12% ao ano)
    const monthlyRate = 0.12 / 12

    // Fórmula de parcela do financiamento
    // PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // Resolvendo para n (prazo)

    let idealTerm = 120 // Começar com 10 anos
    for (let term = 60; term <= this.limits.term.max; term += 12) {
      const installment =
        (financedValue * (monthlyRate * Math.pow(1 + monthlyRate, term))) /
        (Math.pow(1 + monthlyRate, term) - 1)

      if (installment <= maxInstallment) {
        idealTerm = term
        break
      }
    }

    return Math.min(idealTerm, this.limits.term.max)
  }

  /**
   * Sugere o melhor produto para o perfil
   */
  public suggestProduct(proposal: CreditProposal): string {
    const propertyValue = this.getPropertyValueAsNumber(proposal)
    const situation = proposal.situation?.toLowerCase()

    if (situation === 'construcao') {
      return 'piloto'
    }

    if (propertyValue < 150000) {
      return 'isolado' // Produto básico para valores menores
    }

    if (this.hasExistingRelationship(proposal)) {
      return 'premium' // Produto diferenciado para clientes
    }

    return 'isolado'
  }
}
