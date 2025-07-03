import { CreditProposalController } from '@infra/controllers/CreditProposal.controller'
import { CreditSimulationFactory } from './CreditSimulation.factory'
import { RepositoryFactory } from './Repository.factory'
import { IBankProposalApiService } from '@infra/interfaces'
import { SendProposalUseCase } from '@application/use-cases/ProposalCreditUseCases'

export class ProposalControllerFactory {
  static createController(): CreditProposalController {
    try {
      const bankServices = CreditSimulationFactory.createBankServices()

      const proposalServices = bankServices.filter(
        (service) => 'sendProposal' in service
      ) as IBankProposalApiService[]

      if (proposalServices.length === 0) {
        throw new Error('Nenhum serviço bancário de proposta foi encontrado')
      }

      const proposalClientRepository =
        RepositoryFactory.createClientRepository()

      const useCase = new SendProposalUseCase(
        proposalServices,
        proposalClientRepository
      )

      const controller = new CreditProposalController(useCase)
      return controller
    } catch (error: any) {
      throw new Error(
        `Falha ao criar CreditProposalController: ${error.message}`
      )
    }
  }

  static initialize(): {
    controller: CreditProposalController
  } {
    const controller = this.createController()
    return { controller }
  }
}
