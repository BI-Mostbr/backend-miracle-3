import { ProposalDetailsController } from '@infra/controllers/ProposalDetails.controller'
import { Router } from 'express'

export function createProposalDetailsRoutes(
  controller: ProposalDetailsController
): Router {
  const router = Router()

  router.get(
    '/detalhes-proposta/logs',
    controller.getLogs.bind(controller)
  )

  return router
}