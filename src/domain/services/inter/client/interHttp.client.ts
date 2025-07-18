import axios, { AxiosInstance } from 'axios'
import { InterSimulationPayload } from '../types/interSimulationPayload.type'
import { InterProposalPayload } from '../types/InterProposalPayload.type'
import { InterEvolucaoTeoricaResponse } from '@infra/dtos/EvolucaoTeoricaInter.dto'

export class InterHtppClient {
  private readonly axiosInstance: AxiosInstance
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.INTER_API_URL!
    this.axiosInstance = this.createAxiosInstance()
    if (!this.baseUrl) {
      throw new Error('INTER_API_URL is not configured')
    }
  }

  private createAxiosInstance(): AxiosInstance {
    try {
      const config: any = {
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Inter-API-Client/1.0'
        }
      }
      return axios.create(config)
    } catch (error) {
      throw new Error(`Error creating Axios instance: ${error}`)
    }
  }

  async simulateCredit(
    payload: InterSimulationPayload,
    accessToken: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    console.log(headers)
    try {
      const response = await this.axiosInstance.post(
        '/simulacao/calcular',
        payload,
        {
          headers
        }
      )
      return response.data
    } catch (error) {
      throw new Error(`Error simulating inter credit: ${error}`)
    }
  }

  async sendProposal(
    payload: InterProposalPayload,
    accessToken: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      console.log('InterHttpClient: Enviando proposta')
      console.log('Payload da proposta:', JSON.stringify(payload, null, 2))

      const response = await this.axiosInstance.post('/propostas', payload, {
        headers
      })

      console.log('Resposta do Inter:', response.data)
      return response.data
    } catch (error) {
      console.error('Erro ao enviar proposta para o Inter:', error)
      this.handleError(error)
    }
  }

  async getProposal(proposalId: string, accessToken: string) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      const response = await this.axiosInstance.get(
        `/propostas/${proposalId}`,
        {
          headers
        }
      )
      console.log(JSON.stringify(response.data))
      return response.data
    } catch (error) {
      throw new Error(`Erro ao obter GET da proposta: ${error}`)
    }
  }

  async getEvolucaoTeorica(
    proposalNumber: string,
    accessToken: string
  ): Promise<InterEvolucaoTeoricaResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      const response = await this.axiosInstance.get(
        `/evolucao-teorica/${proposalNumber}`,
        {
          headers
        }
      )

      if (!response.data.dataCriacao || !response.data.url) {
        throw new Error('Resposta inválida: dataCriacao ou url não encontrados')
      }

      return {
        dataCriacao: response.data.dataCriacao,
        url: response.data.url
      }
    } catch (error) {
      console.error('Erro ao obter evolução teórica:', error)

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data

        switch (status) {
          case 401:
            throw new Error('Token de acesso inválido ou expirado')
          case 404:
            throw new Error(`Proposta ${proposalNumber} não encontrada`)
          case 400:
            throw new Error('Parâmetros inválidos fornecidos')
          case 403:
            throw new Error('Acesso negado para esta operação')
          case 500:
            throw new Error('Erro interno do servidor Inter')
          default:
            throw new Error(
              `Erro HTTP ${status}: ${data?.message || 'Erro desconhecido'}`
            )
        }
      }

      throw new Error(`Erro ao obter evolução da teoria: ${error}`)
    }
  }

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data

      if (status === 401) {
        throw new Error(
          'Bearer token inválido ou expirado - renovação necessária'
        )
      } else if (status === 400) {
        throw new Error(
          `Dados inválidos: ${data?.message || 'Verifique os dados enviados'}`
        )
      } else if (status === 422) {
        throw new Error(
          `Dados não processáveis: ${data?.message || 'Verifique as regras de negócio'}`
        )
      }
    }

    throw new Error(`Erro ao comunicar com o Inter: ${error}`)
  }
}
