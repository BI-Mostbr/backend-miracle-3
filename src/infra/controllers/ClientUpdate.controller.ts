import { Request, Response } from 'express'
import {
  UpdateDecisionBankRequest,
  RemoveDecisionBankRequest,
  UpdateResponsibleUserRequest,
  UpdatePartnerRequest,
  UpdateClientNameRequest
} from '@infra/dtos/ClientUpdate.dto'
import { ClientUpdateUseCases } from '@application/use-cases/ClientUpdateUseCases'

export class ClientUpdateController {
  constructor(private clientUpdateUseCases: ClientUpdateUseCases) {}

  /**
   * @swagger
   * /api/client/decision-bank:
   *   put:
   *     summary: Atualiza o banco de decisão do cliente
   *     tags: [Client Update]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cpf
   *               - idProposta
   *               - idBanco
   *             properties:
   *               cpf:
   *                 type: string
   *                 description: CPF do cliente
   *               idProposta:
   *                 type: string
   *                 description: ID da proposta
   *               idBanco:
   *                 type: number
   *                 description: ID do banco
   *     responses:
   *       200:
   *         description: Banco de decisão atualizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async updateDecisionBank(req: Request, res: Response): Promise<void> {
    try {
      const requestData: UpdateDecisionBankRequest = req.body

      const result =
        await this.clientUpdateUseCases.updateDecisionBank(requestData)

      const statusCode = result.success ? 200 : 404
      res.status(statusCode).json(result)
    } catch (error) {
      console.error('Erro no controller updateDecisionBank:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  /**
   * @swagger
   * /api/client/decision-bank:
   *   delete:
   *     summary: Remove o banco de decisão do cliente
   *     tags: [Client Update]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cpf
   *             properties:
   *               cpf:
   *                 type: string
   *                 description: CPF do cliente
   *     responses:
   *       200:
   *         description: Banco de decisão removido com sucesso
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async removeDecisionBank(req: Request, res: Response): Promise<void> {
    try {
      const requestData: RemoveDecisionBankRequest = req.body

      const result =
        await this.clientUpdateUseCases.removeDecisionBank(requestData)

      const statusCode = result.success ? 200 : 404
      res.status(statusCode).json(result)
    } catch (error) {
      console.error('Erro no controller removeDecisionBank:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  /**
   * @swagger
   * /api/client/responsible-user:
   *   put:
   *     summary: Atualiza o consultor responsável pelo cliente
   *     tags: [Client Update]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cpf
   *               - idConsultor
   *             properties:
   *               cpf:
   *                 type: string
   *                 description: CPF do cliente
   *               idConsultor:
   *                 type: number
   *                 description: ID do consultor responsável
   *     responses:
   *       200:
   *         description: Consultor responsável atualizado com sucesso
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async updateResponsibleUser(req: Request, res: Response): Promise<void> {
    try {
      const requestData: UpdateResponsibleUserRequest = req.body

      const result =
        await this.clientUpdateUseCases.updateResponsibleUser(requestData)

      const statusCode = result.success ? 200 : 404
      res.status(statusCode).json(result)
    } catch (error) {
      console.error('Erro no controller updateResponsibleUser:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  /**
   * @swagger
   * /api/client/partner:
   *   put:
   *     summary: Atualiza o parceiro do cliente
   *     tags: [Client Update]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cpf
   *               - idPartner
   *             properties:
   *               cpf:
   *                 type: string
   *                 description: CPF do cliente
   *               idPartner:
   *                 type: number
   *                 description: ID do parceiro
   *     responses:
   *       200:
   *         description: Parceiro atualizado com sucesso
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async updatePartner(req: Request, res: Response): Promise<void> {
    try {
      const requestData: UpdatePartnerRequest = req.body

      const result = await this.clientUpdateUseCases.updatePartner(requestData)

      const statusCode = result.success ? 200 : 404
      res.status(statusCode).json(result)
    } catch (error) {
      console.error('Erro no controller updatePartner:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  /**
   * @swagger
   * /api/client/name:
   *   put:
   *     summary: Atualiza o nome do cliente
   *     tags: [Client Update]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cpf
   *               - clientName
   *             properties:
   *               cpf:
   *                 type: string
   *                 description: CPF do cliente
   *               clientName:
   *                 type: string
   *                 description: Nome do cliente
   *     responses:
   *       200:
   *         description: Nome do cliente atualizado com sucesso
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async updateClientName(req: Request, res: Response): Promise<void> {
    try {
      const requestData: UpdateClientNameRequest = req.body

      const result =
        await this.clientUpdateUseCases.updateClientName(requestData)

      const statusCode = result.success ? 200 : 404
      res.status(statusCode).json(result)
    } catch (error) {
      console.error('Erro no controller updateClientName:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }
}
