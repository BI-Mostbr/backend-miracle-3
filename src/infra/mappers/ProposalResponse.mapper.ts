import { CreditProposal } from '@domain/entities'
import {
  SendProposalResult,
  ProposalResult
} from '@application/use-cases/ProposalCreditUseCases'
import { CreditProposalMapper } from './CreditProposal.mapper'
import {
  ProposalApiResponse,
  ProposalOferta,
  STATUS_MAPPING,
  BANK_LOGOS,
  BANK_IDS
} from '@infra/dtos/ProposalResponse.dto'

export class ProposalResponseMapper {
  static mapToFrontendResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): ProposalApiResponse {
    const ofertas: ProposalOferta[] = result.results.map((bankResult, index) =>
      this.mapBankResultToOferta(proposal, bankResult, index)
    )

    return {
      data: {
        cpf: CreditProposalMapper.getCleanCpf(proposal),
        nome: proposal.name,
        ofertas
      }
    }
  }

  private static mapBankResultToOferta(
    proposal: CreditProposal,
    bankResult: ProposalResult,
    index: number
  ): ProposalOferta {
    const bankNameLower = bankResult.bankName.toLowerCase()
    const creditoSolicitado = this.formatCurrency(
      CreditProposalMapper.getFinancedValueAsNumber(proposal)
    )
    const creditoAprovado = bankResult.success ? creditoSolicitado : 'R$ 0,00'
    const taxaJuros = bankResult.success
      ? this.getTaxaJuros(proposal, bankNameLower)
      : '0.00'
    const status = bankResult.success
      ? STATUS_MAPPING['ENVIADO'] || 'Aguardando Processamento'
      : STATUS_MAPPING['ERRO'] || 'Erro no Processamento'

    const observacao = bankResult.success
      ? [
          `Proposta enviada com sucesso - ID: ${bankResult.proposalId || bankResult.proposalNumber}`
        ]
      : [`Erro: ${bankResult.error || 'Erro desconhecido'}`]

    return {
      url: BANK_LOGOS[bankNameLower] || BANK_LOGOS['bradesco'], // fallback
      id: BANK_IDS[bankNameLower] || (index + 1).toString(),
      banco: this.formatBankName(bankResult.bankName),
      status,
      credito_solicitado: creditoSolicitado,
      credito_aprovado: creditoAprovado,
      taxa_juros: taxaJuros,
      observacao
    }
  }

  private static formatCurrency(value: number): string {
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
  static mapSingleBankResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): ProposalApiResponse {
    return this.mapToFrontendResponse(proposal, result)
  }

  static mapMultipleBanksResponse(
    proposal: CreditProposal,
    result: SendProposalResult
  ): ProposalApiResponse {
    return this.mapToFrontendResponse(proposal, result)
  }
}
