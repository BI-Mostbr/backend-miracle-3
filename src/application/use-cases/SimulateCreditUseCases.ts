import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { IBankApiService, ICreditSimulationRepository } from '@infra/interfaces'

export class ServiceCreditUseCase {
  constructor(
    private bankApiService: IBankApiService[],
    private repository: ICreditSimulationRepository
  ) {}

  async simulateWithBank(
    simulation: CreditSimulation,
    bankName: string
  ): Promise<BankResponseSimulation> {}

  async simulateWithAllBanks(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation[]> {}
}
