import { Router } from 'express'
import { CreditProposalController } from '@infra/controllers/CreditProposal.controller'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import {
  CreditProposalRequestSchema,
  BankNameProposalParamSchema,
  MultipleBanksProposalRequestSchema
} from '@infra/schemas/CreditProposal.schema'

export function createCreditProposalRoutes(
  controller: CreditProposalController
): Router {
  const router = Router()
  router.post(
    '/proposal/:bankName',
    ValidationMiddleware.validateParams(BankNameProposalParamSchema),
    ValidationMiddleware.validateRequest(CreditProposalRequestSchema),
    async (req, res) => {
      await controller.sendToSpecificBank(req, res)
    }
  )

  router.post(
    '/proposal/multiple',
    ValidationMiddleware.validateRequest(MultipleBanksProposalRequestSchema),
    async (req, res) => {
      await controller.sendToMultipleBanks(req, res)
    }
  )

  return router
}
