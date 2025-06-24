import axios, { AxiosInstance } from 'axios'
import { InterSimulationPayload } from '../types/interSimulationPayload.type'

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
}
