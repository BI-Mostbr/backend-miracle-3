import { CreditProposal } from '@domain/entities'
import { BankValidationFactory } from '@infra/factories/BankValidation.factory'
import { ValidationResult } from '@infra/interfaces/IBankValidationStrategy.interface'

export interface MultiValidationResult {
  success: boolean
  validBanks: string[]
  invalidBanks: string[]
  bankResults: { [bankName: string]: ValidationResult }
  adjustedProposals: { [bankName: string]: CreditProposal }
  summary: ValidationSummary
  recommendations: string[]
}

export interface ValidationSummary {
  totalBanks: number
  approvedBanks: number
  rejectedBanks: number
  banksWithAdjustments: number
  totalAdjustments: number
  totalWarnings: number
  totalErrors: number
  canProceed: boolean
  bestBankOption?: string
}

export class ProposalValidationManager {
  /**
   * Valida proposta para um banco específico
   */
  static validateForBank(
    proposal: CreditProposal,
    bankName: string
  ): ValidationResult {
    console.log(`🔍 Validando proposta para ${bankName}...`)

    try {
      const strategy = BankValidationFactory.getSingletonStrategy(bankName)
      const result = strategy.validateAndAdjust(proposal)

      this.logValidationResult(result)
      return result
    } catch (error) {
      console.error(`❌ Erro na validação para ${bankName}:`, error)

      return {
        isValid: false,
        errors: [
          {
            code: 'STRATEGY_ERROR',
            field: 'system',
            message:
              error instanceof Error
                ? error.message
                : 'Erro na estratégia de validação',
            severity: 'blocking'
          }
        ],
        warnings: [],
        adjustments: [],
        bankName,
        originalProposal: this.extractProposalFields(proposal)
      }
    }
  }

  /**
   * Valida proposta para múltiplos bancos
   */
  static validateForMultipleBanks(
    proposal: CreditProposal,
    bankNames: string[]
  ): MultiValidationResult {
    console.log(
      `🔍 Validando proposta para múltiplos bancos: ${bankNames.join(', ')}`
    )

    const bankResults: { [bankName: string]: ValidationResult } = {}
    const adjustedProposals: { [bankName: string]: CreditProposal } = {}
    const validBanks: string[] = []
    const invalidBanks: string[] = []

    // Validar cada banco individualmente
    for (const bankName of bankNames) {
      try {
        // Criar cópia da proposta para cada banco
        const proposalCopy = this.deepCloneProposal(proposal)

        // Validar e ajustar
        const result = this.validateForBank(proposalCopy, bankName)
        bankResults[bankName] = result

        if (result.isValid) {
          validBanks.push(bankName)

          // Se houveram ajustes, usar a proposta ajustada
          if (result.adjustments.length > 0 && result.adjustedProposal) {
            // Aplicar ajustes na cópia
            this.applyAdjustmentsToProposal(proposalCopy, result.adjustments)
          }

          adjustedProposals[bankName] = proposalCopy
        } else {
          invalidBanks.push(bankName)
        }
      } catch (error) {
        console.error(`❌ Erro na validação para ${bankName}:`, error)
        invalidBanks.push(bankName)

        bankResults[bankName] = {
          isValid: false,
          errors: [
            {
              code: 'VALIDATION_ERROR',
              field: 'system',
              message: `Erro ao validar ${bankName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              severity: 'blocking'
            }
          ],
          warnings: [],
          adjustments: [],
          bankName,
          originalProposal: this.extractProposalFields(proposal)
        }
      }
    }

    // Gerar resumo
    const summary = this.generateSummary(bankResults, validBanks, invalidBanks)

    // Gerar recomendações
    const recommendations = this.generateRecommendations(
      bankResults,
      validBanks
    )

    const result: MultiValidationResult = {
      success: validBanks.length > 0,
      validBanks,
      invalidBanks,
      bankResults,
      adjustedProposals,
      summary,
      recommendations
    }

    this.logMultiValidationResult(result)
    return result
  }

  /**
   * Valida se é possível prosseguir com o envio
   */
  static canProceedWithSending(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    canProceed: boolean
    validBanks: string[]
    blockers: string[]
    warnings: string[]
  } {
    const validation = this.validateForMultipleBanks(proposal, bankNames)

    const blockers: string[] = []
    const warnings: string[] = []

    // Verificar bloqueadores críticos
    Object.values(validation.bankResults).forEach((result) => {
      result.errors.forEach((error) => {
        if (error.severity === 'blocking') {
          blockers.push(`${result.bankName}: ${error.message}`)
        }
      })

      result.warnings.forEach((warning) => {
        warnings.push(`${result.bankName}: ${warning.message}`)
      })
    })

    return {
      canProceed: validation.success,
      validBanks: validation.validBanks,
      blockers,
      warnings
    }
  }

  /**
   * Retorna a melhor opção de banco baseada nos critérios
   */
  static getBestBankOption(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    bestBank?: string
    reason: string
    alternatives: string[]
    comparison: { [bankName: string]: number }
  } {
    const validation = this.validateForMultipleBanks(proposal, bankNames)

    if (validation.validBanks.length === 0) {
      return {
        reason: 'Nenhum banco aprovou a proposta',
        alternatives: [],
        comparison: {}
      }
    }

    // Calcular score para cada banco válido
    const scores: { [bankName: string]: number } = {}

    validation.validBanks.forEach((bankName) => {
      const result = validation.bankResults[bankName]
      let score = 100 // Score base

      // Penalizar por ajustes (menos ajustes = melhor)
      score -= result.adjustments.length * 10

      // Penalizar por warnings
      score -= result.warnings.length * 5

      // Bonificar bancos com menos restrições
      const strategy = BankValidationFactory.getStrategy(bankName)

      // LTV maior é melhor
      score += strategy.limits.ltv.max * 0.5

      // Prazo maior é melhor
      score += strategy.limits.term.max * 0.01

      scores[bankName] = score
    })

    // Encontrar o melhor
    const bestBank = Object.entries(scores).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0]

    const alternatives = validation.validBanks
      .filter((bank) => bank !== bestBank)
      .sort((a, b) => scores[b] - scores[a])

    return {
      bestBank,
      reason: bestBank
        ? `${bestBank} oferece as melhores condições (score: ${scores[bestBank].toFixed(1)})`
        : 'Não foi possível determinar a melhor opção',
      alternatives,
      comparison: scores
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private static deepCloneProposal(proposal: CreditProposal): CreditProposal {
    return JSON.parse(JSON.stringify(proposal))
  }

  private static extractProposalFields(
    proposal: CreditProposal
  ): Partial<CreditProposal> {
    return {
      propertyValue: proposal.propertyValue,
      financedValue: proposal.financedValue,
      term: proposal.term,
      monthlyIncome: proposal.monthlyIncome,
      propertyType: proposal.propertyType,
      uf: proposal.uf,
      selectedProductOption: proposal.selectedProductOption
    }
  }

  private static applyAdjustmentsToProposal(
    proposal: CreditProposal,
    adjustments: any[]
  ): void {
    adjustments.forEach((adjustment) => {
      switch (adjustment.field) {
        case 'financedValue':
          proposal.financedValue = adjustment.adjustedValue
          break
        case 'term':
          proposal.term = adjustment.adjustedValue.toString()
          break
        case 'propertyValue':
          proposal.propertyValue = adjustment.adjustedValue
          break
      }
    })
  }

  private static generateSummary(
    bankResults: { [bankName: string]: ValidationResult },
    validBanks: string[],
    invalidBanks: string[]
  ): ValidationSummary {
    const totalBanks = Object.keys(bankResults).length
    const approvedBanks = validBanks.length
    const rejectedBanks = invalidBanks.length

    let banksWithAdjustments = 0
    let totalAdjustments = 0
    let totalWarnings = 0
    let totalErrors = 0

    Object.values(bankResults).forEach((result) => {
      if (result.adjustments.length > 0) banksWithAdjustments++
      totalAdjustments += result.adjustments.length
      totalWarnings += result.warnings.length
      totalErrors += result.errors.length
    })

    // Determinar melhor banco
    let bestBankOption: string | undefined
    if (validBanks.length > 0) {
      // Escolher banco com menos ajustes
      bestBankOption = validBanks.reduce((best, current) => {
        const bestAdjustments = bankResults[best]?.adjustments.length || 999
        const currentAdjustments =
          bankResults[current]?.adjustments.length || 999
        return currentAdjustments < bestAdjustments ? current : best
      })
    }

    return {
      totalBanks,
      approvedBanks,
      rejectedBanks,
      banksWithAdjustments,
      totalAdjustments,
      totalWarnings,
      totalErrors,
      canProceed: approvedBanks > 0,
      bestBankOption
    }
  }

  private static generateRecommendations(
    bankResults: { [bankName: string]: ValidationResult },
    validBanks: string[]
  ): string[] {
    const recommendations: string[] = []

    if (validBanks.length === 0) {
      recommendations.push('❌ Nenhum banco aprovou a proposta')
      recommendations.push(
        '💡 Considere revisar: valor do imóvel, valor financiado ou prazo'
      )

      // Analisar erros mais comuns para sugerir correções
      const commonErrors = new Map<string, number>()
      Object.values(bankResults).forEach((result) => {
        result.errors.forEach((error) => {
          commonErrors.set(error.code, (commonErrors.get(error.code) || 0) + 1)
        })
      })

      const mostCommonError = Array.from(commonErrors.entries()).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0]

      switch (mostCommonError) {
        case 'PROPERTY_VALUE_TOO_LOW':
          recommendations.push('🏠 Considere imóveis de maior valor')
          break
        case 'LTV_TOO_HIGH':
          recommendations.push(
            '💰 Aumente o valor da entrada para reduzir o LTV'
          )
          break
        case 'TERM_TOO_LONG':
          recommendations.push('📅 Reduza o prazo do financiamento')
          break
      }
    } else if (validBanks.length === 1) {
      recommendations.push(`✅ Apenas ${validBanks[0]} aprovou a proposta`)
      recommendations.push(
        '💡 Considere ajustar parâmetros para ter mais opções'
      )
    } else {
      recommendations.push(
        `✅ ${validBanks.length} bancos aprovaram a proposta`
      )

      // Identificar banco com melhores condições
      const bankWithFewestAdjustments = validBanks.reduce((best, current) => {
        const bestAdjustments = bankResults[best]?.adjustments.length || 999
        const currentAdjustments =
          bankResults[current]?.adjustments.length || 999
        return currentAdjustments < bestAdjustments ? current : best
      })

      recommendations.push(
        `🏆 ${bankWithFewestAdjustments} oferece as melhores condições`
      )
    }

    // Recomendações específicas baseadas nos ajustes
    const allAdjustments = Object.values(bankResults).flatMap(
      (result) => result.adjustments
    )

    const adjustmentTypes = new Set(allAdjustments.map((adj) => adj.field))

    if (adjustmentTypes.has('financedValue')) {
      recommendations.push(
        '💡 Valor financiado foi ajustado - considere aumentar entrada'
      )
    }

    if (adjustmentTypes.has('term')) {
      recommendations.push(
        '📅 Prazo foi ajustado - revise suas expectativas de parcela'
      )
    }

    return recommendations
  }

  private static logValidationResult(result: ValidationResult): void {
    const status = result.isValid ? '✅' : '❌'
    console.log(
      `${status} ${result.bankName}: ${result.isValid ? 'Aprovado' : 'Rejeitado'}`
    )

    if (result.adjustments.length > 0) {
      console.log(`🔧 ${result.adjustments.length} ajuste(s) aplicado(s)`)
    }

    if (result.warnings.length > 0) {
      console.log(`⚠️ ${result.warnings.length} aviso(s)`)
    }

    if (result.errors.length > 0) {
      console.log(`❌ ${result.errors.length} erro(s)`)
    }
  }

  private static logMultiValidationResult(result: MultiValidationResult): void {
    console.log(`\n📊 Resultado da validação múltipla:`)
    console.log(`   ✅ Aprovados: ${result.validBanks.join(', ') || 'Nenhum'}`)
    console.log(
      `   ❌ Rejeitados: ${result.invalidBanks.join(', ') || 'Nenhum'}`
    )
    console.log(`   🔧 Total de ajustes: ${result.summary.totalAdjustments}`)
    console.log(`   ⚠️ Total de avisos: ${result.summary.totalWarnings}`)
    console.log(`   🏆 Melhor opção: ${result.summary.bestBankOption || 'N/A'}`)

    if (result.recommendations.length > 0) {
      console.log(`\n💡 Recomendações:`)
      result.recommendations.forEach((rec) => console.log(`   ${rec}`))
    }
  }

  // ========== MÉTODOS UTILITÁRIOS PÚBLICOS ==========

  /**
   * Obtém informações detalhadas de todos os bancos
   */
  static getAllBankInfo(): { [bankName: string]: any } {
    return BankValidationFactory.getAllBankLimits()
  }

  /**
   * Verifica disponibilidade de um banco
   */
  static isBankAvailable(bankName: string): boolean {
    return BankValidationFactory.hasStrategy(bankName)
  }

  /**
   * Lista bancos disponíveis
   */
  static getAvailableBanks(): string[] {
    return BankValidationFactory.getAvailableBanks()
  }

  /**
   * Obtém estatísticas das validações
   */
  static getValidationStatistics(): any {
    return BankValidationFactory.getStatistics()
  }

  /**
   * Simula validação sem modificar a proposta
   */
  static simulateValidation(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    wouldPass: { [bankName: string]: boolean }
    requiredAdjustments: { [bankName: string]: string[] }
    recommendations: string[]
  } {
    const wouldPass: { [bankName: string]: boolean } = {}
    const requiredAdjustments: { [bankName: string]: string[] } = {}

    bankNames.forEach((bankName) => {
      try {
        const strategy = BankValidationFactory.getSingletonStrategy(bankName)
        const result = strategy.validate(proposal) // Apenas validar, sem ajustar

        wouldPass[bankName] = result.isValid
        requiredAdjustments[bankName] = result.adjustments.map(
          (adj) => adj.reason
        )
      } catch (error) {
        wouldPass[bankName] = false
        requiredAdjustments[bankName] = ['Erro na validação']
      }
    })

    const passCount = Object.values(wouldPass).filter(Boolean).length
    const recommendations = [
      `${passCount}/${bankNames.length} banco(s) aprovariam a proposta sem ajustes`,
      passCount === 0
        ? 'Ajustes são necessários para todos os bancos'
        : passCount === bankNames.length
          ? 'Proposta aprovada em todos os bancos'
          : 'Alguns bancos requerem ajustes'
    ]

    return {
      wouldPass,
      requiredAdjustments,
      recommendations
    }
  }

  /**
   * Gera relatório detalhado de validação
   */
  static generateDetailedReport(
    proposal: CreditProposal,
    bankNames: string[]
  ): {
    summary: string
    bankDetails: { [bankName: string]: any }
    overallRecommendation: string
    nextSteps: string[]
  } {
    const validation = this.validateForMultipleBanks(proposal, bankNames)

    const bankDetails: { [bankName: string]: any } = {}

    Object.entries(validation.bankResults).forEach(([bankName, result]) => {
      bankDetails[bankName] = {
        approved: result.isValid,
        adjustments: result.adjustments.length,
        warnings: result.warnings.length,
        errors: result.errors.length,
        mainIssues: result.errors.slice(0, 3).map((e) => e.message),
        adjustmentsSummary: result.adjustments.map(
          (a) => `${a.field}: ${a.reason}`
        )
      }
    })

    const summary = `Validação para ${bankNames.length} banco(s): ${validation.validBanks.length} aprovado(s), ${validation.invalidBanks.length} rejeitado(s)`

    const overallRecommendation = validation.success
      ? `Prosseguir com ${validation.summary.bestBankOption || validation.validBanks[0]}`
      : 'Revisar proposta antes de enviar'

    const nextSteps = validation.success
      ? [
          `Enviar proposta para: ${validation.validBanks.join(', ')}`,
          validation.summary.totalAdjustments > 0
            ? 'Informar cliente sobre ajustes aplicados'
            : 'Proposta aprovada sem ajustes',
          'Acompanhar processo de análise dos bancos'
        ]
      : [
          'Revisar parâmetros da proposta',
          'Considerar as sugestões de cada banco',
          'Revalidar após ajustes'
        ]

    return {
      summary,
      bankDetails,
      overallRecommendation,
      nextSteps
    }
  }
}
