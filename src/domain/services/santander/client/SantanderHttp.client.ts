import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { SantanderApiPayload } from '../types/santanderApiTypes'
import { decryptAes } from 'Utils/crypto'

export class SantanderHttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.SANTANDER_API_URL!
    this.axiosInstance = this.createAxiosInstanceWithCerts()
    if (!this.baseUrl) {
      console.error('❌ SANTANDER_API_URL não configurado!')
      throw new Error('SANTANDER_API_URL é obrigatório')
    }
  }

  private createAxiosInstanceWithCerts(): AxiosInstance {
    try {
      const certsPath = path.join(process.cwd(), 'certs', 'santander')
      const keyPath = path.join(certsPath, 'most_corbans.key')
      const certPath = path.join(certsPath, 'most_corbans.crt')
      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)
      const config: any = {
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Santander-API-Client/1.0'
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
        console.warn('⚠️ HTTP client sem certificados')
      }
      return axios.create(config)
    } catch (error) {
      console.error('❌ Erro ao configurar HTTP client:', error)

      return axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Santander-API-Client/1.0'
        }
      })
    }
  }

  async simulateCredit(payload: string, accessToken: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json, text/plain, /',
      Cookie:
        'incap_ses_1695_2932666=2QDkY2Qgh2F5GzIm/tmFF3Fod2UAAAAAYDfGXwWf8uUzO291Wg7gcw==; visid_incap_2932666=qHH36MWVRU+H2ft8Rgsj0nK5dWUAAAAAQUIPAAAAAACksLIKZGOgzWE9uv/oFtCG'
    }

    try {
      const body = {
        enc: payload
      }
      const response = await this.axiosInstance.post(
        '/partnerGraphql/graphql/statementSimulation',
        body,
        {
          headers
        }
      )

      const decrypted = JSON.parse(decryptAes(response.data.enc))
      if (decrypted.errors && decrypted.errors.length > 0) {
        const message = decrypted.errors[0].extensions.messages[1].message
        throw new Error(`Business error: ${message}`)
      }

      return response.data
    } catch (error) {
      if ((error as any).message?.startsWith('Business error:')) {
        // Handle custom business error
        const statusCode = (error as any).message.split(': ')[1]
        throw new Error(`Erro de negócio na simulação: ${statusCode}`)
      }

      if (axios.isAxiosError(error)) {
        console.log(error)
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
            'Simulação - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'Simulação - Token não tem permissão para simulação de crédito'
          )
        } else if (status === 500) {
          throw new Error(
            'Simulação - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'Simulação - Serviço do Santander temporariamente indisponível'
          )
        }
        throw new Error(
          `Simulação - Erro na API do Santander (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
    }
  }

  async simulateCreditCustom(
    payload: string,
    idSimulation: string,
    accessToken: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      const body = {
        enc: payload
      }

      const url = `/partnerSimulation/partnerSimulation/customCalculateSimulation?id_simulation=${idSimulation}&userCode=fe2f76b8b0341c6c213d8edc932c75aa&nrPgCom=fe2f76b8b0341c29&utmSource=d1120ef29b280b63`

      const response = await this.axiosInstance.post(url, body, {
        headers
      })

      const decrypted = JSON.parse(decryptAes(response.data.enc))
      if (decrypted.errors && decrypted.errors.length > 0) {
        const message = decrypted.errors[0].extensions.messages[1].message
        throw new Error(`Business error simulation custom: ${message}`)
      }

      return response.data
    } catch (error) {
      if ((error as any).message?.startsWith('Business error:')) {
        // Handle custom business error
        const statusCode = (error as any).message.split(': ')[1]
        throw new Error(`Simulação Custom - Erro de negócio: ${statusCode}`)
      }

      if (axios.isAxiosError(error)) {
        console.log(error)
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
            'Simulação Custom - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'Simulação Custom - Token não tem permissão para simulação de crédito'
          )
        } else if (status === 500) {
          throw new Error(
            'Simulação Custom - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'Simulação Custom - Serviço do Santander temporariamente indisponível'
          )
        }
        throw new Error(
          `Erro na API do Santander (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
    }
  }

  async saveSimulation(
    idSimulation: string,
    accessToken: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      const url = `/partnerSimulation/partnerSimulation/saveDataSimulation?id_simulation=${idSimulation}&userCode=fe2f76b8b0341c6c213d8edc932c75aa&nrPgCom=fe2f76b8b0341c29&utmSource=d1120ef29b280b63`
      const response = await this.axiosInstance.post(url, {
        headers
      })

      const decrypted = JSON.parse(decryptAes(response.data.enc))

      if (decrypted.errors && decrypted.errors.length > 0) {
        const message = decrypted.errors[0].extensions.messages[1].message
        throw new Error(`Business error saveSimulation: ${message}`)
      }

      return response.data
    } catch (error) {
      if (
        (error as any).message?.startsWith(
          'Business error saveSimulationSantander:'
        )
      ) {
        // Handle custom business error
        const statusCode = (error as any).message.split(': ')[1]
        throw new Error(
          `Erro de negócio no saveSimulationSantander: ${statusCode}`
        )
      }

      if (axios.isAxiosError(error)) {
        console.log(error)
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
            'saveSimulationSantander - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'saveSimulationSantander - Token não tem permissão para simulação de crédito'
          )
        } else if (status === 500) {
          throw new Error(
            'saveSimulationSantander - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'saveSimulationSantander - Serviço do Santander temporariamente indisponível'
          )
        }
        throw new Error(
          `saveSimulation - Erro na API do Santander (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
    }
  }

  async analyzeCredit(payload: string, accessToken: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
    try {
      const body = {
        enc: payload
      }
      const response = await this.axiosInstance.post(
        '/partnerGraphql/graphql/analyzeCredit',
        body,
        {
          headers
        }
      )

      return response.data
    } catch (error) {
      if ((error as any).message?.startsWith('Business error:')) {
        // Handle custom business error
        const statusCode = (error as any).message.split(': ')[1]
        throw new Error(
          `Erro de negócio no analyzeCreditSantander: ${statusCode}`
        )
      }

      if (axios.isAxiosError(error)) {
        console.log(error)
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
            'analyzeCreditSantander - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'analyzeCreditSantander - Token não tem permissão para simulação de crédito'
          )
        } else if (status === 500) {
          throw new Error(
            'analyzeCreditSantander - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'analyzeCreditSantander - Serviço do Santander temporariamente indisponível'
          )
        }
        throw new Error(
          `analyzeCreditSantander - Erro na API do Itaú (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
    }
  }

  async integrateMiniPersonas(
    payload: string,
    accessToken: string
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
    try {
      const body = {
        enc: payload
      }
      const response = await this.axiosInstance.post(
        '/partnerGraphql/graphql/integrateClientMiniPersonas',
        body,
        {
          headers
        }
      )

      return response.data
    } catch (error) {
      if ((error as any).message?.startsWith('Business error:')) {
        // Handle custom business error
        const statusCode = (error as any).message.split(': ')[1]
        throw new Error(
          `Erro de negócio no integrateMiniPersonasSantander: ${statusCode}`
        )
      }

      if (axios.isAxiosError(error)) {
        console.log(error)
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
            'integrateMiniPersonasSantander - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'integrateMiniPersonasSantander - Token não tem permissão para simulação de crédito'
          )
        } else if (status === 500) {
          throw new Error(
            'integrateMiniPersonasSantander - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'integrateMiniPersonasSantander - Serviço do Santander temporariamente indisponível'
          )
        }
        throw new Error(
          `integrateMiniPersonasSantander - Erro na API do Santander (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
    }
  }

  async getPdf(idSimulation: string, accessToken: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }

    try {
      const response = await this.axiosInstance.get(
        `/partnerSimulation/partnerSimulation/statementSimulation?id_simulation=${idSimulation}&userCode=fe2f76b8b0341c6c213d8edc932c75aa&nrPgCom=fe2f76b8b0341c29&utmSource=d1120ef29b280b63`,
        { headers }
      )
      return response.data
    } catch (error) {
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
            'getPdfSantander - Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 403) {
          throw new Error(
            'getPdfSantander - Token não tem permissão para extrair PDF da simulação;'
          )
        } else if (status === 500) {
          throw new Error(
            'getPdfSantander - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        } else if (status === 503) {
          throw new Error(
            'getPdfSantander - Serviço do Santander temporariamente indisponível'
          )
        } else if (status === 400) {
          throw new Error(
            'getPdfSantander - Erro interno do servidor do Santander - tente novamente mais tarde'
          )
        }
        throw new Error(
          `getPdfSantander - Erro na API do Santander (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }
      throw error
    }
  }
}
