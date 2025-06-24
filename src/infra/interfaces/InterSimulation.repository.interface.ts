import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { IInterSimulationResponse } from './InterSimulationResponse.interface'

export interface IInterSimulationRepository {
  save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation
  ): Promise<IInterSimulationResponse>
}
