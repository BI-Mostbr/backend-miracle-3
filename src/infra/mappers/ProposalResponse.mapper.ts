import { CreditProposal } from '@domain/entities'
import {
  SendProposalResult,
  ProposalResult
} from '@application/use-cases/ProposalCreditUseCases'
import { CreditProposalMapper } from './CreditProposal.mapper'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import {
  ProposalApiResponse,
  ProposalOferta,
  BANK_LOGOS,
  BANK_IDS
} from '@infra/dtos/ProposalResponse.dto'

export class ProposalResponseMapper {
  static async mapToFrontendResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): Promise<ProposalApiResponse> {
    const ofertas: ProposalOferta[] = await Promise.all(
      result.results.map((bankResult, index) =>
        this.mapBankResultToOferta(proposal, bankResult, index)
      )
    )

    return {
      data: {
        cpf: CreditProposalMapper.getCleanCpf(proposal),
        nome: proposal.name,
        ofertas
      }
    }
  }

  private static async mapBankResultToOferta(
    proposal: CreditProposal,
    bankResult: ProposalResult,
    index: number
  ): Promise<ProposalOferta> {
    const bankNameLower = bankResult.bankName.toLowerCase()

    const creditoSolicitadoValue = bankResult.adjustedFinancedValue
      ? CreditProposalMapper.parseMoneyString(bankResult.adjustedFinancedValue)
      : CreditProposalMapper.getFinancedValueAsNumber(proposal)

    const creditoSolicitado = this.formatCurrency(creditoSolicitadoValue)

    let creditoAprovado = 'R$ 0,00'
    let status = 'Erro no Processamento'

    if (bankResult.success) {
      try {
        const deParaRepo = RepositoryFactory.createDeParaRepository()
        const statusResult = await deParaRepo.getProposalStatusByCpfAndBank(
          CreditProposalMapper.getCleanCpf(proposal),
          bankResult.bankName
        )

        status = statusResult.situacao

        if (status === 'APROVADO') {
          creditoAprovado = creditoSolicitado
        }
      } catch (error) {
        console.error(
          `Erro ao buscar situação para ${bankResult.bankName}:`,
          error
        )
        status = 'Enviado'
      }
    }

    const taxaJuros = bankResult.success
      ? this.getTaxaJuros(proposal, bankNameLower)
      : '0.00'

    const observacao = this.buildObservacao(bankResult)

    let proposalId: string

    if (bankResult.success) {
      if (bankNameLower === 'inter') {
        proposalId = bankResult.proposalNumber || 'Não informado'
      } else {
        proposalId =
          bankResult.proposalNumber ||
          bankResult.proposalId ||
          BANK_IDS[bankNameLower] ||
          (index + 1).toString()
      }
    } else {
      proposalId = BANK_IDS[bankNameLower] || (index + 1).toString()
    }

    return {
      url: BANK_LOGOS[bankNameLower] || BANK_LOGOS['bradesco'],
      id: proposalId,
      banco: this.formatBankName(bankResult.bankName),
      status,
      credito_solicitado: creditoSolicitado,
      credito_aprovado: creditoAprovado,
      taxa_juros: taxaJuros,
      observacao
    }
  }

  private static buildObservacao(bankResult: ProposalResult): string[] {
    if (!bankResult.success) {
      return [`Erro: ${bankResult.error || 'Erro desconhecido'}`]
    }

    if (!bankResult.adjustments || bankResult.adjustments.length === 0) {
      return []
    }

    const observacoes: string[] = []

    bankResult.adjustments.forEach((adjustment: any) => {
      switch (adjustment.fieldName) {
        case 'financedValue':
          observacoes.push(
            `Valor financiado ajustado de ${adjustment.originalValue} para ${adjustment.adjustedValue} (LTV máximo: ${this.extractLtvFromReason(adjustment.adjustmentReason)})`
          )
          break
        case 'term':
          observacoes.push(
            `Prazo ajustado de ${adjustment.originalValue} para ${adjustment.adjustedValue} meses`
          )
          break
        case 'propertyValue':
          observacoes.push(
            `Valor do imóvel ajustado de ${adjustment.originalValue} para ${adjustment.adjustedValue}`
          )
          break
        default:
          observacoes.push(adjustment.adjustmentReason)
      }
    })

    return observacoes
  }

  private static extractLtvFromReason(reason: string): string {
    const match = reason.match(/LTV máximo de (\d+)%/)
    return match ? `${match[1]}%` : ''
  }

  private static formatCurrency(value: number): string {
    if (isNaN(value) || value === null || value === undefined) {
      console.warn('Valor inválido para formatação:', value)
      return 'R$ 0,00'
    }

    if (value > 10000000) {
      value = value / 100
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  private static formatBankName(bankName: string): string {
    const bankNameMap: { [key: string]: string } = {
      itau: 'Itaú',
      inter: 'Inter',
      santander: 'Santander',
      bradesco: 'Bradesco',
      bb: 'Banco do Brasil',
      caixa: 'Caixa Econômica Federal'
    }

    return bankNameMap[bankName.toLowerCase()] || bankName
  }

  private static getTaxaJuros(
    proposal: CreditProposal,
    bankName: string
  ): string {
    const defaultRates: { [key: string]: string } = {
      itau: '13.69',
      inter: '12.50',
      santander: '14.20',
      bradesco: '13.95',
      bb: '11.80',
      caixa: '10.50'
    }

    if (proposal.financingRate && proposal.financingRate !== 'PRE_FIXADA') {
      const rateMatch = proposal.financingRate.match(/(\d+\.?\d*)/)
      if (rateMatch) {
        return rateMatch[1]
      }
    }

    return defaultRates[bankName] || '13.50'
  }

  static async mapSingleBankResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): Promise<ProposalApiResponse> {
    return await this.mapToFrontendResponse(proposal, result)
  }

  static async mapMultipleBanksResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): Promise<ProposalApiResponse> {
    return await this.mapToFrontendResponse(proposal, result)
  }
}
