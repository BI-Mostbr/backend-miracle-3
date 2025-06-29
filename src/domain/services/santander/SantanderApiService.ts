import { decryptAes, encryptAes } from '../../../Utils/crypto'
import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { SantanderAuthService } from './auth/santanderAuthService'
import { SantanderHttpClient } from './client/SantanderHttp.client'
import { SantanderPayloadMapper } from './mappers/SantanderPayload.mapper'
import { SantanderResponseMapper } from './mappers/SantanderResponse.mapper'
import { IBankApiService } from '@infra/interfaces'

export class SantanderApiService implements IBankApiService {
  private readonly authService: SantanderAuthService
  private readonly httpClient: SantanderHttpClient

  constructor() {
    this.authService = new SantanderAuthService()
    this.httpClient = new SantanderHttpClient()
  }

  getBankName(): string {
    return 'santander'
  }

  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token
    const santanderPayload = SantanderPayloadMapper.convertToPayload(simulation)
    const bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))
    const santanderResponse = await this.httpClient.simulateCredit(
      bodyEncriptado,
      accessTokenDecript
    )
    const santanderResponseDrcript = JSON.parse(
      decryptAes(santanderResponse.enc)
    ).data.calculateSimulation

    const internSantanderResponse =
      SantanderResponseMapper.convertToInternApiResponse(
        santanderResponseDrcript,
        simulation
      )
    return internSantanderResponse
  }

  async getSimulation(request: any) {
    const idSimulation = request.idSimulation
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token
    const idSimulationEncript = encryptAes(idSimulation)
    const santanderPdfResponse = await this.httpClient.getPdf(
      idSimulationEncript,
      accessTokenDecript
    )
    const santanderPdfResponseDecript = JSON.parse(
      decryptAes(santanderPdfResponse.enc)
    )
    return santanderPdfResponseDecript
  }
}
