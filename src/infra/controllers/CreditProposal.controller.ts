import { Request, Response } from 'express'
import { SendProposalUseCase } from '@application/use-cases/ProposalCreditUseCases'
import { CreditProposal } from '@domain/entities'
import { ProposalResponseMapper } from '@infra/mappers/ProposalResponse.mapper'

export class CreditProposalController {
  constructor(private useCase: SendProposalUseCase) {}

  async sendToSpecificBank(req: Request, res: Response): Promise<void> {
    try {
      const { bankName } = req.params
      const proposalData: CreditProposal = req.body

      try {
        const result = await this.useCase.sendToSpecificBank(
          proposalData,
          bankName
        )

        const frontendResponse =
          await ProposalResponseMapper.mapSingleBankResponse(
            proposalData,
            result
          )

        const statusCode = result.success ? 200 : 400
        res.status(statusCode).json(frontendResponse)
      } catch (useCaseError) {
        throw useCaseError
      }
    } catch (error) {
      const errorResponse = this.createErrorResponse(
        req.body as CreditProposal,
        req.params.bankName,
        error instanceof Error ? error.message : 'Erro interno do servidor'
      )

      res.status(500).json(errorResponse)
    }
  }

  async sendToMultipleBanks(req: Request, res: Response): Promise<void> {
    try {
      const proposalData: CreditProposal = req.body
      const { bankNames } = req.body

      if (!bankNames || !Array.isArray(bankNames) || bankNames.length === 0) {
        res.status(400).json({
          error: 'Campo bankNames é obrigatório e deve ser um array não vazio'
        })
        return
      }

      const result = await this.useCase.sendToMultipleBanks(
        proposalData,
        bankNames
      )

      const frontendResponse =
        await ProposalResponseMapper.mapMultipleBanksResponse(
          proposalData,
          result
        )

      res.status(200).json(frontendResponse)
    } catch (error) {
      const errorResponse = this.createErrorResponse(
        req.body as CreditProposal,
        'múltiplos bancos',
        error instanceof Error ? error.message : 'Erro interno do servidor'
      )

      res.status(500).json(errorResponse)
    }
  }

  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          itau: 'OK',
          inter: 'OK'
        }
      }

      res.status(200).json(status)
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao verificar status dos serviços',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  private createErrorResponse(
    proposal: CreditProposal,
    bankName: string,
    errorMessage: string
  ) {
    return {
      data: {
        cpf: proposal.document?.replace(/\D/g, '') || '',
        nome: proposal.name || '',
        ofertas: [
          {
            url: '',
            id: '0',
            banco: bankName,
            status: 'Erro no Processamento',
            credito_solicitado: 'R$ 0,00',
            credito_aprovado: 'R$ 0,00',
            taxa_juros: '0.00',
            observacao: [`Erro: ${errorMessage}`]
          }
        ]
      }
    }
  }
}
