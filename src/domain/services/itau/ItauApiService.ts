import { IBankApiService, IBankProposalApiService } from '@infra/interfaces'
import { ItauAuthService } from './auth/itauAuthService'
import { ItauHttpClient } from './client/ItauHttp.client'
import {
  BankProposalResponse,
  BankResponseSimulation,
  CreditProposal,
  CreditSimulation
} from '@domain/entities'
import { ItauPayloadMapper } from './mappers/ItauPayload.mapper'
import { ItauResponseMapper } from './mappers/itauResponse.mapper'
import {
  GetItauSimulationRequest,
  GetItauSimulationResponse,
  GetItauSimulationWithInstallmentsResponse
} from '@infra/dtos/GetSimulation.dto'
import { ItauGetSimulationResponseMapper } from './mappers/ItauGetSimulationResponse.mapper'
import {
  ConsultorData,
  ItauProposalPayloadMapper
} from './mappers/ItauProposalPayload.mapper'
import { ItauProposalResponseMapper } from './mappers/ItauProposalResponse.mapper'
import { UserRepository } from '@infra/repositories/User.repository'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { delay } from 'Utils/delay'

export class ItauApiService
  implements IBankApiService, IBankProposalApiService
{
  private readonly authService: ItauAuthService
  private readonly httpClient: ItauHttpClient
  private readonly userRepository: UserRepository

  constructor() {
    this.authService = new ItauAuthService()
    this.httpClient = new ItauHttpClient()
    this.validateConfiguration()
    this.userRepository = new UserRepository(
      RepositoryFactory.getPrismaClient()
    )
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
  ): Promise<
    GetItauSimulationResponse | GetItauSimulationWithInstallmentsResponse
  > {
    try {
      const accessToken = await this.authService.getAccessToken()
      const itauRawResponse = await this.httpClient.getSimulation(
        request.idSimulation,
        accessToken,
        request.includeCreditAnalysis || false,
        request.includeInstallments || false
      )

      const frontendResponse =
        ItauGetSimulationResponseMapper.mapItauToFrontend(
          itauRawResponse,
          request.includeInstallments || false
        )

      return frontendResponse
    } catch (error) {
      throw new Error(
        `Erro ao buscar simulação ${request.idSimulation} no Itaú: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async sendProposal(proposal: CreditProposal): Promise<BankProposalResponse> {
    try {
      let consultorData: ConsultorData | undefined
      try {
        if (proposal.consultorId) {
          const userData = await this.userRepository.findUserById(
            proposal.consultorId
          )
          if (userData) {
            consultorData = {
              nome_itau: userData.nome_itau ?? undefined,
              cpf: userData.cpf
            }
          }
        }
      } catch (userError) {
        throw new Error('Erro ao buscar dados do consultor')
      }

      const accessToken = await this.authService.getAccessToken()
      console.log(accessToken)
      const itauPayload = ItauProposalPayloadMapper.convertToPayload(
        proposal,
        consultorData
      )
      console.log('payload itau:', JSON.stringify(itauPayload))
      const itauResponse = await this.httpClient.sendProposal(
        itauPayload,
        accessToken
      )
      console.log('itauResponse:', JSON.stringify(itauResponse))
      const bankResponse = ItauProposalResponseMapper.convertToInternalResponse(
        itauResponse,
        proposal
      )
      console.log('bankResponse:', JSON.stringify(bankResponse))
      return bankResponse
    } catch (error) {
      return this.handleTokenError(error, () => this.sendProposal(proposal))
    }
  }

  async getProposalDetails(proposalNumber: string): Promise<any> {
    try {
      const accessToken = await this.authService.getAccessToken()
      await delay(5000)
      const proposalDetails = await this.httpClient.getProposal(
        parseInt(proposalNumber),
        accessToken
      )

      return proposalDetails
    } catch (error) {
      return this.handleTokenError(error, () =>
        this.getProposalDetails(proposalNumber)
      )
    }
  }

  private async handleTokenError<T>(
    error: any,
    retryFunction: () => Promise<T>
  ): Promise<T> {
    if (
      error instanceof Error &&
      error.message.includes('Bearer token inválido')
    ) {
      try {
        await this.authService.refreshToken()
        const result = await retryFunction()
        return result
      } catch (retryError) {
        throw new Error(
          `Falha no ${this.getBankName()} mesmo após renovação do token: ${retryError}`
        )
      }
    }
    throw new Error(`${this.getBankName()} operation failed: ${error}`)
  }

  async refreshCredentials(): Promise<void> {
    await this.authService.refreshToken()
  }
}
