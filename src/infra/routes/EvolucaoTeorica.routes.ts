import { Router } from 'express'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import { EvolucaoTeoricaController } from '@infra/controllers/EvolucaoTeoricainter.controller'
import { EvolucaoTeoricaParamSchema } from '@infra/schemas/EvolucaoTeoricaInter.schema'

export function createEvolucaoTeoricaRoutes(
  controller: EvolucaoTeoricaController
): Router {
  const router = Router()

  router.get(
    '/evolucao-teorica/:proposalNumber',
    ValidationMiddleware.validateParams(EvolucaoTeoricaParamSchema),
    async (req, res) => {
      await controller.getEvolucaoTeorica(req, res)
    }
  )

  return router
}
