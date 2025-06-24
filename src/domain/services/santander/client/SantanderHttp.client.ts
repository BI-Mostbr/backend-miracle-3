import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { SantanderApiPayload } from '../types/santanderApiTypes'

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
        '/statementSimulation',
        body,
        {
          headers
        }
      )

      return response.data
    } catch (error) {
      //Tratar erros
      throw new Error('Erro na simulação Santander')
    }
  }
}
