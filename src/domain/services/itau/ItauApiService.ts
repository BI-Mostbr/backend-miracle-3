import { IBankApiService } from '@infra/interfaces'
import { ItauAuthService } from './auth/itauAuthService'
import { ItauHttpClient } from './client/ItauHttp.client'
import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { ItauPayloadMapper } from './mappers/ItauPayload.mapper'
import { ItauResponseMapper } from './mappers/itauResponse.mapper'

export class ItauApiService implements IBankApiService {
  private readonly authService: ItauAuthService
  private readonly httpClient: ItauHttpClient

  constructor() {
    this.authService = new ItauAuthService()
    this.httpClient = new ItauHttpClient()
  }

  getBankName(): string {
    return 'Itaú'
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
      const internApiResponse =
        ItauResponseMapper.convertToInternApiResponse(itauResponse)

      return internApiResponse
    } catch (error) {
      console.error(`Error in ${this.getBankName()} simulation:`, error)
      throw new Error(
        `${this.getBankName()} simulation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
