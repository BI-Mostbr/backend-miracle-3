import { InterHtppClient } from '@domain/services/inter/client/interHttp.client'
import { InterAuthService } from '@domain/services/inter/auth/interAuth.service'
import { InterEvolucaoTeoricaResponse } from '@infra/dtos/EvolucaoTeoricaInter.dto'

export interface EvolucaoTeoricaResult {
  proposalNumber: string
  dataCriacao: string
  url: string
  success: boolean
  error?: string
}

export class GetEvolucaoTeoricaUseCase {
  constructor(
    private interClient: InterHtppClient,
    private interAuthService: InterAuthService
  ) {}

  async execute(proposalNumber: string): Promise<EvolucaoTeoricaResult> {
    try {
      if (!proposalNumber || proposalNumber.trim() === '') {
        throw new Error('Número da proposta é obrigatório')
      }

      if (!/^\d+$/.test(proposalNumber)) {
        throw new Error('Número da proposta deve conter apenas dígitos')
      }

      const accessToken = await this.interAuthService.getAccessToken()

      if (!accessToken) {
        throw new Error('Falha ao obter token de autenticação')
      }

      const response: InterEvolucaoTeoricaResponse =
        await this.interClient.getEvolucaoTeorica(proposalNumber, accessToken)

      if (!response.url) {
        throw new Error('URL do PDF não encontrada na resposta')
      }

      return {
        proposalNumber,
        dataCriacao: response.dataCriacao,
        url: response.url,
        success: true
      }
    } catch (error) {
      console.error('Erro ao obter evolução teórica:', error)

      return {
        proposalNumber,
        dataCriacao: '',
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}
