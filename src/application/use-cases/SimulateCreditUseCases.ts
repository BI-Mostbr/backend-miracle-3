import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import {
  BankParameterNormalizer,
  CreditSimulationWithPropertyType,
  NormalizedSimulation
} from '@domain/services/BankParameterNormalizer'
import { CreditSimulationDomainService } from '@domain/services/CreditSimulationDomain.service'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankApiService } from '@infra/interfaces'

export interface SimulationResult {
  bankResponse: BankResponseSimulation
  normalizationResult: NormalizedSimulation
  hadAdjustments: boolean
}
export class SimulateCreditUseCase {
  constructor(private bankServices: IBankApiService[]) {}

  async simulateWithBank(
    simulation: CreditSimulationWithPropertyType,
    bankName: string
  ): Promise<SimulationResult> {
    if (!CreditSimulationDomainService.validateBusinessRules(simulation)) {
      throw new Error('Simulation does not meet business rules')
    }
    const bankService = this.findBankService(bankName)
    const normalizationResult =
      BankParameterNormalizer.normalizeSimulationForBank(simulation, bankName)
    this.logAdjustments(normalizationResult, bankName)

    try {
      const bankResponse = await bankService.simulationCredit(
        normalizationResult.normalizedSimulation
      )

      await this.saveSimulation(
        normalizationResult.normalizedSimulation,
        bankResponse,
        bankName
      )

      return {
        bankResponse,
        normalizationResult,
        hadAdjustments: normalizationResult.adjustments.length > 0
      }
    } catch (error) {
      console.error(`Error in bank simulation: ${bankName}`, error)
      throw error
    }
  }

  async simulateWithAllBanks(
    simulation: CreditSimulationWithPropertyType
  ): Promise<Record<string, SimulationResult>> {
    if (!CreditSimulationDomainService.validateBusinessRules(simulation)) {
      throw new Error('Simulation does not meet business rules')
    }

    const results: Record<string, SimulationResult> = {}
    const allNormalizations =
      BankParameterNormalizer.normalizeSimulationForAllBanks(simulation)

    for (const bankService of this.bankServices) {
      const bankName = bankService.getBankName()
      const normalizationResult = allNormalizations[bankName]

      if (!normalizationResult) {
        console.warn(`No normalization rules found for bank: ${bankName}`)
        continue
      }

      try {
        const bankResponse = await bankService.simulationCredit(
          normalizationResult.normalizedSimulation
        )

        await this.saveSimulation(
          normalizationResult.normalizedSimulation,
          bankResponse,
          bankName
        )

        results[bankName] = {
          bankResponse,
          normalizationResult,
          hadAdjustments: normalizationResult.adjustments.length > 0
        }
      } catch (error) {
        console.error(`Failed to simulate with ${bankName}:`, error)
      }
    }

    return results
  }

  async getSimulationFromBank(bankName: string, request: any): Promise<any> {
    const bankService = this.bankServices.find((service) => {
      const serviceName = service.getBankName().toLowerCase().trim()
      const matches = serviceName === bankName.toLowerCase().trim()
      return matches
    })
    if (!bankService) {
      throw new Error(`Bank service for ${bankName} not found`)
    }
    try {
      const simulationData = await bankService.getSimulation(request)
      console.log(`Simulação obtida com sucesso do ${bankName}`)
      return simulationData
    } catch (error) {
      console.error(`Error getting simulation from ${bankName}:`, error)
      throw error
    }
  }

  checkRequiredAdjustments(
    simulation: CreditSimulationWithPropertyType,
    bankName: string
  ): NormalizedSimulation {
    return BankParameterNormalizer.normalizeSimulationForBank(
      simulation,
      bankName
    )
  }

  checkRequiredAdjustmentsForAllBanks(
    simulation: CreditSimulationWithPropertyType
  ): Record<string, NormalizedSimulation> {
    return BankParameterNormalizer.normalizeSimulationForAllBanks(simulation)
  }

  private findBankService(bankName: string): IBankApiService {
    const bankService = this.bankServices.find((service) => {
      const serviceName = service.getBankName().toLowerCase().trim()
      return serviceName === bankName.toLowerCase().trim()
    })

    if (!bankService) {
      throw new Error(`Bank service for ${bankName} not found`)
    }

    return bankService
  }

  private logAdjustments(
    normalizationResult: NormalizedSimulation,
    bankName: string
  ): void {
    if (normalizationResult.adjustments.length > 0) {
      console.log(`Adjustments made for ${bankName}:`)
      normalizationResult.adjustments.forEach((adjustment, index) => {
        console.log(
          `${index + 1}. ${adjustment.fieldName}: ${adjustment.originalValue} → ${adjustment.adjustedValue}`
        )
        console.log(`Reason: ${adjustment.adjustmentReason}`)
      })
    } else {
      console.log(`No adjustments needed for ${bankName}`)
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
        case 'inter':
          const interRepo = RepositoryFactory.createInterRepository()
          await interRepo.save(simulation, bankResponse)
        default:
          break
      }
    } catch (error) {
      console.error(`Error saving simulation for ${bankName} table:`, error)
    }
  }
}
