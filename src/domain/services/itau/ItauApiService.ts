import { IBankApiService } from '@infra/interfaces'
import { ItauAuthService } from './auth/itauAuthService'
import { ItauHttpClient } from './client/itauHtppClient'
import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { ItauPayloadMapper } from './mappers/itauPayloadMappers'

export class ItauApiService implements IBankApiService {
  private readonly authService: ItauAuthService
  private readonly httpClient: ItauHttpClient

  constructor() {
    this.authService = new ItauAuthService()
    this.httpClient = new ItauHttpClient()
  }
  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    try {
      const accessToken = await this.authService.getAccessToken()
      const itauPayload = ItauPayloadMapper.convertToPayload(simulation)
      const itauResponse = await this.httpClient.simulateCredit(
        itauPayload,
        accessToken
      )
      return {
        financingValue: itauResponse.property_price,
        installments: itauResponse.period,
        firstInstallment: itauResponse.first_installment,
        lastInstallment: itauResponse.last_installment,
        interestRate: itauResponse.interest_rate,
        loanAmount: itauResponse.loan_amount,
        amortizationType: itauResponse.amortization_type,
        ltv: itauResponse.ltv
      }
    } catch (error) {
      console.error(`Error in ${this.getBankName()} simulation:`, error)
      throw error
    }
  }

  getBankName(): string {
    return 'Itaú'
  }
}
