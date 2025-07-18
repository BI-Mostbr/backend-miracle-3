import { SimulateCreditUseCase } from '@application/use-cases/SimulateCreditUseCases'
import { InterApiService } from '@domain/services/inter/InterApiService'
import { ItauApiService } from '@domain/services/itau/ItauApiService'
import { SantanderApiService } from '@domain/services/santander/SantanderApiService'
import { CreditSimulationController } from '@infra/controllers/CreditSimulation.controller'
import { IBankApiService } from '@infra/interfaces'

export class CreditSimulationFactory {
  static createBankServices(): IBankApiService[] {
    const services: IBankApiService[] = []
    try {
      const itauService = new ItauApiService()
      const santanderService = new SantanderApiService()
      const interService = new InterApiService()
      services.push(itauService)
      services.push(santanderService)
      services.push(interService)
      console.log('Default Itaú service created successfully')
    } catch (error) {
      console.error('Error creating default Itaú service:', error)
      console.error('Check your environment variables and API credentials')
    }
    return services
  }

  static createUseCase(): SimulateCreditUseCase {
    console.log('Creating SimulateCreditUseCase...')
    try {
      const bankServices = this.createBankServices()
      if (bankServices.length === 0) {
        throw new Error('Nenhum serviço bancário foi criado com sucesso')
      }
      const useCase = new SimulateCreditUseCase(bankServices)
      console.log('SimulateCreditUseCase created successfully')
      return useCase
    } catch (error: any) {
      console.error('Error creating SimulateCreditUseCase:', error)
      throw new Error(
        `Failed to create SimulateCreditUseCase: ${error.message}`
      )
    }
  }

  static createController(): CreditSimulationController {
    console.log('Creating CreditSimulationController...')

    try {
      const useCase = this.createUseCase()
      const controller = new CreditSimulationController(useCase)
      console.log('CreditSimulationController created successfully')
      return controller
    } catch (error: any) {
      console.error('Error creating CreditSimulationController:', error)
      throw new Error(
        `Failed to create CreditSimulationController: ${error.message}`
      )
    }
  }

  static createSpecificBankService(bankName: string): IBankApiService {
    const bankNameLower = bankName.toLowerCase()
    switch (bankNameLower) {
      case 'itau':
        return new ItauApiService()
      case 'santander':
        return new SantanderApiService()
      case 'inter':
        return new InterApiService()
      default:
        throw new Error(`Unsupported bank: ${bankName}`)
    }
  }

  static initialize(): {
    controller: CreditSimulationController
  } {
    const controller = this.createController()
    console.log('CreditSimulationFactory initialized successfully')
    return { controller }
  }
}
