import { CreditSimulation } from '@domain/entities'

export interface ICreditSimulationRepository {
  save(simulation: CreditSimulation): Promise<void>
  findById(id: string): Promise<CreditSimulation | null>
  findByCustomerCpf(cpf: string): Promise<CreditSimulation[]>
}
