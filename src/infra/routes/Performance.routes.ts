import { PerformanceController } from '@infra/controllers/Performance.controller'
import { Router } from 'express'

export function createPerformanceRoutes(
  controller: PerformanceController
): Router {
  const router = Router()

  router.get(
    '/meu-desempenho',
    controller.getPerformance.bind(controller)
  )

  return router
}