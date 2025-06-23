import { CreditSimulation, BankResponseSimulation } from '@domain/entities'
import { IBankApiService } from '@infra/interfaces'
import { InterAuthService } from './auth/interAuth.service'
import { InterHtppClient } from './client/interHttp.client'
import { InterPayloadMapper } from './mappers/interPayload.mapper'
import { InterResponseMapper } from './mappers/interResponse.mapper'

export class InterApiService implements IBankApiService {
  private readonly authService: InterAuthService
  private readonly httpClient: InterHtppClient

  constructor() {
    this.authService = new InterAuthService()
    this.httpClient = new InterHtppClient()
  }
  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    try {
      const accessToken = await this.authService.getAccessToken()
      const interPayload = InterPayloadMapper.convertToPayload(simulation)
      const interResponse = await this.httpClient.simulateCredit(
        interPayload,
        accessToken
      )
      const toDatabseResponse = InterResponseMapper.convertToInternApiResponse(
        interResponse,
        simulation
      )
      return toDatabseResponse
    } catch (error) {
      console.error(`Erro na simulação do ${this.getBankName()}:`, error)
      if (error instanceof Error) {
        if (error.message.includes('Bearer token inválido')) {
          try {
            await this.authService.getAccessToken()
            const newAccessToken = await this.authService.getAccessToken()
            const interPayload = InterPayloadMapper.convertToPayload(simulation)
            const retryResponse = await this.httpClient.simulateCredit(
              interPayload,
              newAccessToken
            )
            return retryResponse
          } catch (retryError) {
            console.error(`Erro ao tentar refazer a simulação:`, retryError)
            throw retryError
          }
        }
      }
      throw new Error(
        `Erro ao simular crédito no ${this.getBankName()}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }
  getBankName(): string {
    return 'inter'
  }
}
