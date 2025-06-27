import { CreditSimulationController } from '@infra/controllers/CreditSimulation.controller'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import {
  BankNameParamSchema,
  CreditSimulationRequestSchema,
  GetSimulationRequestSchema
} from '@infra/schemas/CreditSimulation.schema'
import { Router } from 'express'

export function createCreditSimulationRoutes(
  controller: CreditSimulationController
): Router {
  const router = Router()

  router.post(
    '/simulation/all',
    ValidationMiddleware.validateRequest(CreditSimulationRequestSchema),
    (req, res) => controller.simulateWithAllBanks(req, res)
  )

  router.post(
    '/simulation/:bankName',
    ValidationMiddleware.validateParams(BankNameParamSchema),
    ValidationMiddleware.validateRequest(CreditSimulationRequestSchema),
    (req, res) => controller.simulateWithBank(req, res)
  )

  router.post(
    '/simulation/:bankName/get',
    ValidationMiddleware.validateParams(BankNameParamSchema),
    ValidationMiddleware.validateRequest(GetSimulationRequestSchema),
    (req, res) => controller.getSimulationFromBank(req, res)
  )

  return router
}
