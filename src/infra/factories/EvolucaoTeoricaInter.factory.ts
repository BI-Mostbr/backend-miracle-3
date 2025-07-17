import { InterHtppClient } from '@domain/services/inter/client/interHttp.client'
import { InterAuthService } from '@domain/services/inter/auth/interAuth.service'
import { EvolucaoTeoricaController } from '@infra/controllers/EvolucaoTeoricainter.controller'
import { GetEvolucaoTeoricaUseCase } from '@application/use-cases/GetEvolucaoTeoricaInterUseCase'

export class EvolucaoTeoricaFactory {
  static createController(): EvolucaoTeoricaController {
    try {
      const interClient = new InterHtppClient()
      const interAuthService = new InterAuthService()
      const useCase = new GetEvolucaoTeoricaUseCase(
        interClient,
        interAuthService
      )

      const controller = new EvolucaoTeoricaController(useCase)
      return controller
    } catch (error: any) {
      throw new Error(
        `Falha ao criar EvolucaoTeoricaController: ${error.message}`
      )
    }
  }

  static initialize(): {
    controller: EvolucaoTeoricaController
  } {
    const controller = this.createController()
    return { controller }
  }
}
