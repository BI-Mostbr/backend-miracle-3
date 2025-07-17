import { ClientUpdateController } from '@infra/controllers/ClientUpdate.controller'
import { ClientUpdateUseCases } from '@application/use-cases/ClientUpdateUseCases'
import { RepositoryFactory } from './Repository.factory'

export class ClientUpdateControllerFactory {
  static createController(): ClientUpdateController {
    try {
      const clientRepository = RepositoryFactory.createClientRepository()
      const clientUpdateUseCases = new ClientUpdateUseCases(clientRepository)
      const controller = new ClientUpdateController(clientUpdateUseCases)

      return controller
    } catch (error: any) {
      console.error('Erro ao criar ClientUpdateController:', error)
      throw new Error(`Falha ao criar ClientUpdateController: ${error.message}`)
    }
  }

  static initialize(): {
    controller: ClientUpdateController
  } {
    const controller = this.createController()
    return { controller }
  }
}
