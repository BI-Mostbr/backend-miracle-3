import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export interface IBankApiService {
  simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation>
  getBankName(): string
  getSimulation(request: any): Promise<any>
}
