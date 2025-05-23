import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export class ItauApiService {
  getBankName(): string {
    return 'Itaú'
  }
  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    const payload = this.convertToPayload(simulation)
    const itauResponse = await this.callItauApi(payload)
    return this.convertItauResponseApi(itauResponse)
  }

  private convertToPayload(simulation: CreditSimulation) {}
  private convertItauResponseApi(itauResponse: any): any {}
  private callItauApi(payload: any): any {}
}
