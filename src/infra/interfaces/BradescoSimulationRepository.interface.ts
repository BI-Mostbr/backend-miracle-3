import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { IBradescoSimulationData } from './BradescoSimulationData.interface'

export interface IBradescoSimulationRepository {
  save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation,
    userId?: string
  ): Promise<IBradescoSimulationData>
}
