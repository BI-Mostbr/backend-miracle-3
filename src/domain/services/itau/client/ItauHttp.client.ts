import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { ItauApiPayload } from '../types/itauApiTypes'
import { ItauProposalPayload } from '../types/ItauProposalPayload.type'

export class ItauHttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly legacyAxiosInstance: AxiosInstance
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.ITAU_API_URL!
    this.axiosInstance = this.createAxiosInstanceWithCerts()
    this.legacyAxiosInstance = this.createLegacyAxiosInstanceWithCerts()
    if (!this.baseUrl) {
      console.error('ITAU_API_URL não configurado!')
      throw new Error('ITAU_API_URL é obrigatório')
    }
  }
  private createAxiosInstanceWithCerts(): AxiosInstance {
    try {
      const certsPath = path.join(process.cwd(), 'certs', 'itau')
      const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
      const certPath = path.join(certsPath, 'Certificado_itau.crt')
      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)
      const config: any = {
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-API-Client/1.0'
        }
      }

      if (keyExists && certExists) {
        const key = fs.readFileSync(keyPath, 'utf8')
        const cert = fs.readFileSync(certPath, 'utf8')

        const httpsAgent = new https.Agent({
          key: key,
          cert: cert,
          rejectUnauthorized: true
        })
        config.httpsAgent = httpsAgent
      } else {
        console.warn('HTTP client sem certificados')
      }
      return axios.create(config)
    } catch (error) {
      console.error('Erro ao configurar HTTP client:', error)

      return axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-API-Client/1.0'
        }
      })
    }
  }

  private createLegacyAxiosInstanceWithCerts(): AxiosInstance {
    try {
      const certsPath = path.join(process.cwd(), 'certs', 'itau')
      const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
      const certPath = path.join(certsPath, 'Certificado_itau.crt')
      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)

      const config: any = {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-Legacy-API-Client/1.0'
        }
      }

      if (keyExists && certExists) {
        const key = fs.readFileSync(keyPath, 'utf8')
        const cert = fs.readFileSync(certPath, 'utf8')

        const httpsAgent = new https.Agent({
          key: key,
          cert: cert,
          rejectUnauthorized: true
        })
        config.httpsAgent = httpsAgent
      } else {
        console.warn('Legacy HTTP client sem certificados')
      }

      return axios.create(config)
    } catch (error) {
      console.error('Erro ao configurar legacy HTTP client:', error)
      return axios.create({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-Legacy-API-Client/1.0'
        }
      })
    }
  }

  async simulateCredit(
    payload: ItauApiPayload,
    accessToken: string
  ): Promise<any> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId
    }

    try {
      const response = await this.axiosInstance.post(
        '/proposal-financing-partners/v1/simulations',
        payload,
        {
          headers
        }
      )
      return response.data
    } catch (error) {
      console.error('Erro na simulação do Itaú:')

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data
        const responseHeaders = error.response?.headers

        console.error(`Status: ${status}`)
        console.error(`Response Headers:`)
        console.error(JSON.stringify(responseHeaders, null, 2))
        console.error(`Response Data:`)
        console.error(JSON.stringify(data, null, 2))

        if (status === 401) {
          throw new Error(
            'Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 400) {
          throw new Error(
            `Dados inválidos na simulação: ${data?.message || data?.error_description || 'Verifique os dados enviados'}`
          )
        } else if (status === 403) {
          throw new Error('Token não tem permissão para simulação de crédito')
        } else if (status === 422) {
          throw new Error(
            `Dados não processáveis: ${data?.message || data?.error_description || 'Verifique as regras de negócio'}`
          )
        } else if (status === 429) {
          throw new Error(
            'Rate limit excedido - aguarde antes de tentar novamente'
          )
        } else if (status === 500) {
          throw new Error(
            'Erro interno do servidor do Itaú - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error('Serviço do Itaú temporariamente indisponível')
        }
        throw new Error(
          `Erro na API do Itaú (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
      console.error(
        '   Erro de rede:',
        error instanceof Error ? error.message : String(error)
      )
      throw new Error(
        `Erro de rede na comunicação com o Itaú: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async sendProposal(
    payload: ItauProposalPayload,
    accessToken: string
  ): Promise<any> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-itau-apiKey': process.env.ITAU_API_KEY!,
      'x-itau-appid': process.env.ITAU_APP_ID!,
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId
    }
    console.log('Headers:', headers)

    try {
      const response = await this.axiosInstance.post(
        '/proposal-financing-partners/v1/proposals',
        payload,
        {
          headers
        }
      )
      return response.data
    } catch (error) {
      console.error('❌ Erro ao enviar proposta para o Itaú:', error)
      this.handleError(error)
    }
  }

  private generateFlowId(): string {
    return `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  async getProposal(idProposal: number, accessToken: string): Promise<any> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-itau-apiKey': process.env.ITAU_API_KEY!,
      'x-itau-appid': process.env.ITAU_APP_ID!,
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId
    }

    try {
      const response = await this.legacyAxiosInstance.get(
        `https://api.itau.com.br/creditos_imobiliario/v1/propostas/${idProposal}`,
        {
          headers
        }
      )
      return response.data
    } catch (error) {
      console.error('❌ Erro ao buscar proposta do Itaú:', error)
      //this.handleError(error)
    }
  }

  async getSimulation(
    idSimulation: string,
    accessToken: string,
    includeCreditAnalysis: boolean,
    includeInstallments: boolean
  ): Promise<any> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()

    const headers = {
      'Content-Type': 'application/json',
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId,
      'x-itau-apiKey': process.env.ITAU_API_KEY!,
      Authorization: `Bearer ${accessToken}`
    }
    const queryParams = {
      includeCreditAnalysis: includeCreditAnalysis,
      includeInstallments: includeInstallments
    }
    console.log(queryParams)
    try {
      const response = await this.axiosInstance.get(
        `/proposal-financing-partners/v1/simulations/${idSimulation}`,
        { headers, params: queryParams }
      )
      console.log(JSON.stringify(response.data))
      return response.data
    } catch (error) {
      throw new Error(
        `Erro ao buscar simulação ${idSimulation} do Itaú: ${error instanceof Error ? error.message : String(error)}`
      )
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
      } else if (status === 403) {
        throw new Error('Token não tem permissão para esta operação')
      } else if (status === 422) {
        throw new Error(
          `Dados não processáveis: ${data?.message || 'Verifique as regras de negócio'}`
        )
      } else if (status === 429) {
        throw new Error(
          'Rate limit excedido - aguarde antes de tentar novamente'
        )
      } else if (status === 500) {
        throw new Error(
          'Erro interno do servidor do Itaú - tente novamente mais tarde'
        )
      } else if (status === 503) {
        throw new Error('Serviço do Itaú temporariamente indisponível')
      }

      throw new Error(
        `Erro na API do Itaú (${status}): ${data?.message || 'Erro desconhecido'}`
      )
    }

    throw new Error(`Erro de rede na comunicação com o Itaú: ${error}`)
  }
}
