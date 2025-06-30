// src/infra/routes/CreditProposal.routes.ts

import { Router } from 'express'
import { CreditProposalController } from '@infra/controllers/CreditProposal.controller'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import {
  CreditProposalRequestSchema,
  BankNameProposalParamSchema
} from '@infra/schemas/CreditProposal.schema'

export function createCreditProposalRoutes(
  controller: CreditProposalController
): Router {
  const router = Router()

  /**
   * POST /api/credit/proposal/:bankName
   * Enviar proposta para banco específico
   */
  router.post(
    '/proposal/:bankName',
    ValidationMiddleware.validateParams(BankNameProposalParamSchema),
    ValidationMiddleware.validateRequest(CreditProposalRequestSchema),
    (req, res) => controller.sendToSpecificBank(req, res)
  )

  /**
   * POST /api/credit/proposal/multiple
   * Enviar proposta para múltiplos bancos
   */
  router.post(
    '/proposal/multiple',
    ValidationMiddleware.validateRequest(CreditProposalRequestSchema),
    (req, res) => controller.sendToMultipleBanks(req, res)
  )

  /**
   * GET /api/credit/proposal/status
   * Verificar status dos serviços de proposta
   */
  router.get('/proposal/status', (req, res) =>
    controller.getServiceStatus(req, res)
  )

  return router
}
