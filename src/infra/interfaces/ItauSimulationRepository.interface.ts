import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { IItauSimulationData } from './ItauSimulationData.interface'

export interface IItauSimulationRepository {
  save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation,
    userId: string
  ): Promise<IItauSimulationData>
}
