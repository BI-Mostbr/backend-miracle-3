import {
  CreditSimulation,
  BankResponseSimulation,
  CreditProposal,
  BankProposalResponse
} from '@domain/entities'
import { IBankApiService } from '@infra/interfaces'
import { InterAuthService } from './auth/interAuth.service'
import { InterHtppClient } from './client/interHttp.client'
import { InterPayloadMapper } from './mappers/interPayload.mapper'
import { InterResponseMapper } from './mappers/interResponse.mapper'
import { InterProposalPayloadMapper } from './mappers/InterProposalPayload.mapper'
import { InterProposalResponseMapper } from './mappers/InterProposalResponse.mapper'
import { delay } from 'Utils/delay'

export class InterApiService implements IBankApiService {
  private readonly authService: InterAuthService
  private readonly httpClient: InterHtppClient

  constructor() {
    this.authService = new InterAuthService()
    this.httpClient = new InterHtppClient()
  }

  getSimulation(request: any): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    try {
      const accessToken = await this.authService.getAccessToken()
      const interPayload = InterPayloadMapper.convertToPayload(simulation)
      console.log(JSON.stringify(interPayload))
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

  async sendProposal(proposal: CreditProposal): Promise<BankProposalResponse> {
    try {
      const accessToken = await this.authService.getAccessToken()
      const interPayload = InterProposalPayloadMapper.convertToPayload(proposal)

      const interResponse = await this.httpClient.sendProposal(
        interPayload,
        accessToken
      )
      await delay(3000)
      const proposalDetails = await this.httpClient.getProposal(
        interResponse.idProposta,
        accessToken
      )
      console.log(proposalDetails.idProposta)

      const mappedResponse = InterProposalResponseMapper.mapToInternalResponse(
        interResponse,
        proposalDetails.idProposta
      )

      return mappedResponse
    } catch (error) {
      console.error(
        `Erro ao enviar proposta para o ${this.getBankName()}:`,
        error
      )

      if (
        error instanceof Error &&
        error.message.includes('Bearer token inválido')
      ) {
        try {
          const newAccessToken = await this.authService.getAccessToken()
          const interPayload =
            InterProposalPayloadMapper.convertToPayload(proposal)
          const retryResponse = await this.httpClient.sendProposal(
            interPayload,
            newAccessToken
          )
          return InterProposalResponseMapper.mapToInternalResponse(
            retryResponse
          )
        } catch (retryError) {
          console.error(`❌ Erro ao tentar reenviar a proposta:`, retryError)
          throw retryError
        }
      }

      return {
        bankName: this.getBankName(),
        proposalId: '',
        status: 'ERRO',
        bankSpecificData: {
          inter: {
            idProposta: '',
            proposalNumber: '',
            idSimulacao: ''
          }
        }
      }
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
        console.log(`🔄 Tentando renovar token do ${this.getBankName()}...`)
        const newAccessToken = await this.authService.getAccessToken()
        const result = await retryFunction()
        console.log(`✅ Operação realizada com sucesso após renovação do token`)
        return result
      } catch (retryError) {
        console.error(`❌ Erro mesmo após renovação do token:`, retryError)
        throw retryError
      }
    }

    throw new Error(
      `Erro no ${this.getBankName()}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }

  getBankName(): string {
    return 'inter'
  }
}
