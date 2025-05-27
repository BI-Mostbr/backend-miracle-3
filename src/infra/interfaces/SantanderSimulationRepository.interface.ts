import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { ISantanderSimulationData } from './SantanderSimulationData.interface'

export interface ISantanderSimulationRepository {
  save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation,
    userId?: string
  ): Promise<ISantanderSimulationData>
}
