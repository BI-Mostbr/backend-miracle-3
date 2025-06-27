import { IBankApiService } from '@infra/interfaces'
import { ItauAuthService } from './auth/itauAuthService'
import { ItauHttpClient } from './client/ItauHttp.client'
import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { ItauPayloadMapper } from './mappers/ItauPayload.mapper'
import { ItauResponseMapper } from './mappers/itauResponse.mapper'
import {
  GetItauSimulationRequest,
  GetItauSimulationResponse
} from '@infra/dtos/GetSimulation.dto'
import { ItauGetSimulationResponseMapper } from './mappers/ItauGetSimulationResponse.mapper'

export class ItauApiService implements IBankApiService {
  private readonly authService: ItauAuthService
  private readonly httpClient: ItauHttpClient

  constructor() {
    this.authService = new ItauAuthService()
    this.httpClient = new ItauHttpClient()
    this.validateConfiguration()
  }

  private validateConfiguration(): void {
    if (!this.authService.hasCredentials()) {
      throw new Error('Credenciais do Itaú não configuradas corretamente')
    }
  }

  getBankName(): string {
    return 'itau'
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
      const internApiResponse = ItauResponseMapper.convertToInternApiResponse(
        itauResponse,
        simulation
      )
      return internApiResponse
    } catch (error) {
      console.error(`Erro na simulação do ${this.getBankName()}:`, error)
      if (error instanceof Error) {
        if (error.message.includes('Bearer token inválido')) {
          try {
            await this.authService.refreshToken()
            const newAccessToken = await this.authService.getAccessToken()
            const itauPayload = ItauPayloadMapper.convertToPayload(simulation)
            const retryResponse = await this.httpClient.simulateCredit(
              itauPayload,
              newAccessToken
            )
            const retryInternResponse =
              ItauResponseMapper.convertToInternApiResponse(
                retryResponse,
                simulation
              )
            return retryInternResponse
          } catch (retryError) {
            console.error('Erro mesmo após renovação do token:', retryError)
            throw new Error(
              `Falha na simulação do Itaú mesmo após renovação do token: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            )
          }
        }
        throw new Error(
          `${this.getBankName()} simulation failed: ${error.message}`
        )
      }

      throw new Error(
        `${this.getBankName()} simulation failed: ${String(error)}`
      )
    }
  }

  async getSimulation(
    request: GetItauSimulationRequest
  ): Promise<GetItauSimulationResponse> {
    try {
      const accessToken = await this.authService.getAccessToken()
      const itauRawResponse = await this.httpClient.getSimulation(
        request.idSimulation,
        accessToken,
        request.includeCreditAnalysis,
        request.includeInstallments
      )
      const frontendResponse =
        ItauGetSimulationResponseMapper.mapItauToFrontend(itauRawResponse)
      return frontendResponse
    } catch (error) {
      throw new Error(
        `Erro ao buscar simulação ${request.idSimulation} no Itaú: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async refreshCredentials(): Promise<void> {
    console.log('Forçando renovação das credenciais...')
    await this.authService.refreshToken()
    console.log('Credenciais renovadas')
  }
}
