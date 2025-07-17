import { Router } from 'express'
import { ClientUpdateController } from '@infra/controllers/ClientUpdate.controller'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import {
  UpdateDecisionBankRequestSchema,
  RemoveDecisionBankRequestSchema,
  UpdateResponsibleUserRequestSchema,
  UpdatePartnerRequestSchema,
  UpdateClientNameRequestSchema
} from '@infra/schemas/ClientUpdate.schema'

export function createClientUpdateRoutes(
  controller: ClientUpdateController
): Router {
  const router = Router()

  router.put(
    '/client/decision-bank',
    ValidationMiddleware.validateRequest(UpdateDecisionBankRequestSchema),
    async (req, res) => {
      await controller.updateDecisionBank(req, res)
    }
  )

  router.delete(
    '/client/decision-bank',
    ValidationMiddleware.validateRequest(RemoveDecisionBankRequestSchema),
    async (req, res) => {
      await controller.removeDecisionBank(req, res)
    }
  )

  router.put(
    '/client/responsible-user',
    ValidationMiddleware.validateRequest(UpdateResponsibleUserRequestSchema),
    async (req, res) => {
      await controller.updateResponsibleUser(req, res)
    }
  )

  router.put(
    '/client/partner',
    ValidationMiddleware.validateRequest(UpdatePartnerRequestSchema),
    async (req, res) => {
      await controller.updatePartner(req, res)
    }
  )

  router.put(
    '/client/name',
    ValidationMiddleware.validateRequest(UpdateClientNameRequestSchema),
    async (req, res) => {
      await controller.updateClientName(req, res)
    }
  )

  return router
}
