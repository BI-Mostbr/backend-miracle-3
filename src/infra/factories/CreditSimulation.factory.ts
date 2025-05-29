import { SimulateCreditUseCase } from '@application/use-cases/SimulateCreditUseCases'
import { ItauApiService } from '@domain/services/itau/ItauApiService'
import { CreditSimulationController } from '@infra/controllers/CreditSimulation.controller'
import { IBankApiService } from '@infra/interfaces'

export class CreditSimulationFactory {
  static createBankServices(): IBankApiService[] {
    const services: IBankApiService[] = []
    try {
      const itauService = new ItauApiService()
      services.push(itauService)
    } catch (error) {
      console.error('Error creating default Itaú service:', error)
      console.error('Check your environment variables and API credentials')
    }
    return services
  }

  static createUseCase(): SimulateCreditUseCase {
    console.log('🎯 Creating SimulateCreditUseCase...')
    try {
      const bankServices = this.createBankServices()
      const useCase = new SimulateCreditUseCase(bankServices)
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
      return controller
    } catch (error: any) {
      console.error('Error creating CreditSimulationController:', error)
      throw new Error(
        `Failed to create CreditSimulationController: ${error.message}`
      )
    }
  }

  static createSpecificBankService(bankName: string): IBankApiService {
    const bankNameUpper = bankName.toLowerCase()
    switch (bankNameUpper) {
      case 'itau':
      case 'itaú':
        return new ItauApiService()
      default:
        throw new Error(`Unsupported bank: ${bankName}`)
    }
  }

  static initialize(): {
    controller: CreditSimulationController
  } {
    const controller = this.createController()
    return { controller }
  }
}
