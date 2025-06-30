import { IBankProposalApiService } from '@infra/interfaces'
import { ProposalRepositoryFactory } from './ProposalRepository.factory'

export class CreditProposalFactory {
  static createBankServices(): IBankProposalApiService[] {
    const services: IBankProposalApiService[] = []

    try {
      // Itaú
      const itauService = new ItauProposalApiService()
      services.push(itauService)
      console.log('✅ Serviço Itaú para propostas criado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar serviço Itaú para propostas:', error)
    }

    try {
      // Inter
      const interService = new InterProposalApiService()
      services.push(interService)
      console.log('✅ Serviço Inter para propostas criado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar serviço Inter para propostas:', error)
    }

    return services
  }

  static createUseCase(): SendProposalUseCase {
    console.log('🏗️ Criando SendProposalUseCase...')

    try {
      const bankServices = this.createBankServices()
      const clientRepository =
        ProposalRepositoryFactory.createClientRepository()

      if (bankServices.length === 0) {
        throw new Error('Nenhum serviço bancário foi criado com sucesso')
      }

      const useCase = new SendProposalUseCase(bankServices, clientRepository)
      console.log('✅ SendProposalUseCase criado com sucesso')
      return useCase
    } catch (error: any) {
      console.error('❌ Erro ao criar SendProposalUseCase:', error)
      throw new Error(`Falha ao criar SendProposalUseCase: ${error.message}`)
    }
  }

  static createController(): CreditProposalController {
    console.log('🏗️ Criando CreditProposalController...')

    try {
      const useCase = this.createUseCase()
      const controller = new CreditProposalController(useCase)
      console.log('✅ CreditProposalController criado com sucesso')
      return controller
    } catch (error: any) {
      console.error('❌ Erro ao criar CreditProposalController:', error)
      throw new Error(
        `Falha ao criar CreditProposalController: ${error.message}`
      )
    }
  }

  static createSpecificBankService(bankName: string): IBankProposalApiService {
    const bankNameLower = bankName.toLowerCase()

    switch (bankNameLower) {
      case 'itau':
        return new ItauProposalApiService()
      case 'inter':
        return new InterProposalApiService()
      // case 'santander':
      //   return new SantanderProposalApiService()
      default:
        throw new Error(`Banco não suportado para propostas: ${bankName}`)
    }
  }

  static initialize(): {
    controller: CreditProposalController
  } {
    const controller = this.createController()
    console.log('✅ CreditProposalFactory inicializado com sucesso')
    return { controller }
  }
}

// Atualizar src/infra/factories/Repository.factory.ts - Adicionar métodos
// Adicionar estes métodos à classe RepositoryFactory existente:

// static createItauProposalRepository(): ItauProposalRepository {
//   return new ItauProposalRepository(this.getPrismaClient())
// }

// static createInterProposalRepository(): InterProposalRepository {
//   return new InterProposalRepository(this.getPrismaClient())
// }

// static createClientRepository(): ClientRepository {
//   return new ClientRepository(this.getPrismaClient())
// }
