import { CreditProposalController } from '@infra/controllers/CreditProposal.controller'
import { CreditSimulationFactory } from './CreditSimulation.factory'
import { RepositoryFactory } from './Repository.factory'
import { IBankProposalApiService } from '@infra/interfaces'
import { SendProposalUseCase } from '@application/use-cases/ProposalCreditUseCases'

export class ProposalControllerFactory {
  static createController(): CreditProposalController {
    console.log('🏗️ Criando CreditProposalController...')

    try {
      // Usar os services existentes da CreditSimulationFactory
      const bankServices = CreditSimulationFactory.createBankServices()

      // Filtrar apenas os services que implementam IBankProposalApiService
      const proposalServices = bankServices.filter(
        (service) => 'sendProposal' in service
      ) as IBankProposalApiService[]

      if (proposalServices.length === 0) {
        throw new Error('Nenhum serviço bancário de proposta foi encontrado')
      }

      // Criar repository de cliente
      const clientRepository = RepositoryFactory.createClientRepository()

      // Criar use case
      const useCase = new SendProposalUseCase(
        proposalServices,
        clientRepository
      )

      // Criar controller
      const controller = new CreditProposalController(useCase)

      console.log('✅ CreditProposalController criado com sucesso')
      console.log(
        `📋 Services de proposta disponíveis: ${proposalServices.map((s) => s.getBankName()).join(', ')}`
      )

      return controller
    } catch (error: any) {
      console.error('❌ Erro ao criar CreditProposalController:', error)
      throw new Error(
        `Falha ao criar CreditProposalController: ${error.message}`
      )
    }
  }

  static initialize(): {
    controller: CreditProposalController
  } {
    const controller = this.createController()
    console.log('✅ ProposalControllerFactory inicializado com sucesso')
    return { controller }
  }
}
