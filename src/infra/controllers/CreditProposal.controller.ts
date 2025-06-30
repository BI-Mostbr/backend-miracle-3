import { Request, Response } from 'express'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import { CreditProposalRequest } from '@infra/dtos/CreditProposal.dto'
import { SendProposalUseCase } from '@application/use-cases/ProposalCreditUseCases'

export class CreditProposalController {
  constructor(private useCase: SendProposalUseCase) {}

  /**
   * @openapi
   * /api/credit/proposal/{bankName}:
   *   post:
   *     summary: Enviar proposta para banco específico
   *     description: Envia proposta de financiamento para um banco específico
   *     tags:
   *       - Credit Proposal
   *     parameters:
   *       - in: path
   *         name: bankName
   *         required: true
   *         schema:
   *           type: string
   *           enum: [itau, inter, santander, bradesco]
   *         description: Nome do banco
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fluxo
   *               - selectedProductOption
   *               - propertyValue
   *               - financedValue
   *               - term
   *               - document
   *               - name
   *               - userId
   *             properties:
   *               fluxo:
   *                 type: string
   *                 enum: [normal, reenvio, adicionar-banco]
   *               selectedProductOption:
   *                 type: string
   *                 enum: [ISOLADO, PILOTO, REPASSE, PORTABILIDADE]
   *               propertyValue:
   *                 type: string
   *                 example: "R$ 500.000,00"
   *               financedValue:
   *                 type: string
   *                 example: "R$ 400.000,00"
   *               term:
   *                 type: string
   *                 example: "360"
   *               document:
   *                 type: string
   *                 example: "123.456.789-00"
   *               name:
   *                 type: string
   *                 example: "João Silva"
   *               userId:
   *                 type: number
   *                 example: 1
   *     responses:
   *       200:
   *         description: Proposta enviada com sucesso
   *       400:
   *         description: Dados inválidos ou falha no envio
   *       500:
   *         description: Erro interno do servidor
   */
  async sendToSpecificBank(req: Request, res: Response): Promise<void> {
    try {
      const bankName = req.params.bankName?.toLowerCase()
      const proposalRequest: CreditProposalRequest = req.body

      console.log(`🚀 Enviando proposta para ${bankName}`)

      // Converter request para entidade de domínio
      const proposal = CreditProposalMapper.convertFromRequest(proposalRequest)

      // Enviar proposta
      const result = await this.useCase.sendToSpecificBank(proposal, bankName)

      // Resposta com informações detalhadas
      const response = {
        success: result.success,
        data: {
          bankName,
          result: result.results[0],
          clientId: result.clientId,
          flowType: result.flowType,
          message: result.success
            ? 'Proposta enviada e dados salvos com sucesso'
            : 'Falha no envio da proposta - dados não foram salvos'
        },
        timestamp: new Date().toISOString()
      }

      console.log(
        `${result.success ? '✅' : '❌'} Proposta processada para ${bankName}:`,
        result.success ? 'SUCESSO' : 'ERRO'
      )

      res.status(result.success ? 200 : 400).json(response)
    } catch (error) {
      console.error('❌ Erro no envio de proposta:', error)

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * @openapi
   * /api/credit/proposal/multiple:
   *   post:
   *     summary: Enviar proposta para múltiplos bancos
   *     description: Envia proposta de financiamento para múltiplos bancos simultaneamente. Os dados só são salvos se pelo menos um banco tiver sucesso.
   *     tags:
   *       - Credit Proposal
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - selectedBanks
   *               - fluxo
   *               - selectedProductOption
   *               - propertyValue
   *               - financedValue
   *               - term
   *               - document
   *               - name
   *               - userId
   *             properties:
   *               selectedBanks:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [itau, inter, santander, bradesco]
   *                 example: ["itau", "inter"]
   *               fluxo:
   *                 type: string
   *                 enum: [normal, reenvio, adicionar-banco]
   *               selectedProductOption:
   *                 type: string
   *                 enum: [ISOLADO, PILOTO, REPASSE, PORTABILIDADE]
   *     responses:
   *       200:
   *         description: Pelo menos uma proposta foi enviada com sucesso
   *       400:
   *         description: Todas as propostas falharam ou dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  async sendToMultipleBanks(req: Request, res: Response): Promise<void> {
    try {
      const proposalRequest: CreditProposalRequest = req.body
      const bankNames = proposalRequest.selectedBanks

      console.log(
        `🚀 Enviando proposta para múltiplos bancos: ${bankNames.join(', ')}`
      )

      // Converter request para entidade de domínio
      const proposal = CreditProposalMapper.convertFromRequest(proposalRequest)

      // Enviar para múltiplos bancos
      const result = await this.useCase.sendToMultipleBanks(proposal, bankNames)

      // Calcular estatísticas
      const successCount = result.results.filter((r) => r.success).length
      const errorCount = result.results.filter((r) => !r.success).length

      // Estruturar resposta
      const response = {
        success: result.success, // true se pelo menos um banco teve sucesso
        data: {
          summary: {
            totalBanks: bankNames.length,
            successCount: successCount,
            errorCount: errorCount,
            dataSaved: result.success // Os dados foram salvos apenas se houve sucesso
          },
          results: result.results,
          clientId: result.clientId,
          flowType: result.flowType,
          message: result.success
            ? `${successCount}/${bankNames.length} bancos com sucesso. Dados salvos.`
            : `Todas as ${bankNames.length} tentativas falharam. Dados não foram salvos.`
        },
        timestamp: new Date().toISOString()
      }

      console.log(`${result.success ? '✅' : '❌'} Propostas processadas:`, {
        total: bankNames.length,
        sucessos: successCount,
        erros: errorCount,
        dadosSalvos: result.success
      })

      // Status 200 se pelo menos uma proposta foi enviada com sucesso
      const statusCode = result.success ? 200 : 400

      res.status(statusCode).json(response)
    } catch (error) {
      console.error('❌ Erro no envio de propostas múltiplas:', error)

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * @openapi
   * /api/credit/proposal/status:
   *   get:
   *     summary: Verificar status dos serviços de proposta
   *     description: Retorna o status de disponibilidade dos serviços bancários para propostas
   *     tags:
   *       - Credit Proposal
   *     responses:
   *       200:
   *         description: Status dos serviços
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 services:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       bankName:
   *                         type: string
   *                       available:
   *                         type: boolean
   *                       features:
   *                         type: array
   *                         items:
   *                           type: string
   */
  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      // Lista de bancos disponíveis para propostas
      const availableServices = [
        {
          bankName: 'itau',
          available: true,
          features: ['simulation', 'proposal', 'getSimulation'],
          persistence: 'conditional' // Dados salvos apenas com sucesso
        },
        {
          bankName: 'inter',
          available: true,
          features: ['simulation', 'proposal'],
          persistence: 'conditional'
        },
        {
          bankName: 'santander',
          available: true,
          features: ['simulation'], // Apenas simulação por enquanto
          persistence: 'conditional'
        }
      ]

      res.json({
        success: true,
        services: availableServices,
        persistenceStrategy: 'conditional', // Dados só salvos com pelo menos um sucesso
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Erro ao verificar status dos serviços:', error)

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      })
    }
  }
}
