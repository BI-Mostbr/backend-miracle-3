import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { CreditSimulationDomainService } from '@domain/services/CreditSimulationDomain.service'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankApiService } from '@infra/interfaces'

export class SimulateCreditUseCase {
  constructor(private bankServices: IBankApiService[]) {}

  async simulateWithBank(
    simulation: CreditSimulation,
    bankName: string
  ): Promise<BankResponseSimulation> {
    if (!CreditSimulationDomainService.validateBusinessRules(simulation)) {
      throw new Error('Simulation does not meet business rules')
    }

    const bankService = this.bankServices.find((service) => {
      const serviceName = service.getBankName().toLowerCase().trim()
      const matches = serviceName === bankName.toLowerCase().trim()
      return matches
    })

    if (!bankService) {
      throw new Error(`Bank service for ${bankName} not found`)
    }

    try {
      const bankResponse = await bankService.simulationCredit(simulation)
      await this.saveSimulation(simulation, bankResponse, bankName)
      return bankResponse
    } catch (error) {
      console.error(`Error in bank simulation:${bankName}`, error)
      throw error
    }
  }

  private async saveSimulation(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation,
    bankName: string
  ): Promise<void> {
    try {
      switch (bankName.toLowerCase()) {
        case 'itau':
          const itauRepo = RepositoryFactory.createItauRepository()
          await itauRepo.save(simulation, bankResponse)
          break
        case 'santander':
          const santanderRepo = RepositoryFactory.createSantanderRepository()
          await santanderRepo.save(simulation, bankResponse)
          break
        // case 'bradesco':
        //     const bradescoRepo = RepositoryFactory.createBradescoRepository()
        //     await bradescoRepo.save(simulation, bankResponse)
        //     break;
        default:
          break
      }
    } catch (error) {
      console.error(`Error saving simulation for ${bankName} table:`, error)
    }
  }
}
