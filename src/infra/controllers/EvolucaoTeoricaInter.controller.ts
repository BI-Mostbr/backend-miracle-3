import { GetEvolucaoTeoricaUseCase } from '@application/use-cases/GetEvolucaoTeoricaInterUseCase'
import { Request, Response } from 'express'

export class EvolucaoTeoricaController {
  constructor(private useCase: GetEvolucaoTeoricaUseCase) {}

  /**
   * @openapi
   * /api/credit/evolucao-teorica/{proposalNumber}:
   *   get:
   *     summary: Obter URL da evolução teórica de uma proposta
   *     description: Retorna a URL do PDF da evolução teórica de uma proposta específica do banco Inter
   *     tags:
   *       - Evolução Teórica
   *     parameters:
   *       - in: path
   *         name: proposalNumber
   *         required: true
   *         schema:
   *           type: string
   *           pattern: '^\d+
   *         description: Número da proposta (preserva zeros à esquerda)
   *         example: "004629374"
   *     responses:
   *       200:
   *         description: URL da evolução teórica obtida com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     proposalNumber:
   *                       type: string
   *                       example: "004629374"
   *                     dataCriacao:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-12-19T11:14:16.25Z"
   *                     url:
   *                       type: string
   *                       format: uri
   *                       example: "https://citrb-prd-originacao-documentos.s3.sa-east-1.amazonaws.com/evolucao-teorica/..."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-01-15T10:30:00.000Z"
   *       400:
   *         description: Parâmetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Número da proposta deve conter apenas dígitos"
   *       404:
   *         description: Proposta não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Proposta não encontrada"
   *       500:
   *         description: Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Erro interno do servidor"
   */
  async getEvolucaoTeorica(req: Request, res: Response): Promise<void> {
    try {
      const proposalNumber = req.params.proposalNumber

      if (!proposalNumber || proposalNumber.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Número da proposta é obrigatório',
          timestamp: new Date().toISOString()
        })
        return
      }

      const result = await this.useCase.execute(proposalNumber)

      if (!result.success) {
        const statusCode = result.error?.includes('não encontrada') ? 404 : 400

        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          proposalNumber: result.proposalNumber,
          dataCriacao: result.dataCriacao,
          url: result.url
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro no controller EvolucaoTeorica:', error)

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      })
    }
  }
}
