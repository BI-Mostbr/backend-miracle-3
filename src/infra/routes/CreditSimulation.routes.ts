import { CreditSimulationController } from '@infra/controllers/CreditSimulation.controller'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import {
  BankNameParamSchema,
  CreditSimulationRequestSchema
} from '@infra/schemas/CreditSimulation.schema'
import { Router } from 'express'

export function createCreditSimulationRoutes(
  controller: CreditSimulationController
): Router {
  const router = Router()
  router.post(
    '/simulation/:bankName',
    ValidationMiddleware.validateParams(BankNameParamSchema),
    ValidationMiddleware.validateRequest(CreditSimulationRequestSchema),
    (req, res) => controller.simulateWithBank(req, res)
  )

  return router
}
