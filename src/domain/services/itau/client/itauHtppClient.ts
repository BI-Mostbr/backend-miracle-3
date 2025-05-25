import axios, { AxiosInstance } from 'axios'
import { ItauApiPayload } from '../types/itauApiTypes'

export class ItauHttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly apiKey: string
  private readonly appId: string

  constructor() {
    const baseURL = process.env.ITAU_API_URL!
    this.apiKey = process.env.ITAU_API_KEY!
    this.appId = process.env.ITAU_APP_ID!

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async simulateCredit(
    payload: ItauApiPayload,
    accessToken: string
  ): Promise<any> {
    const flowId = this.generateFlowId()

    try {
      const response = await this.axiosInstance.post('/simulation', payload, {
        headers: {
          'x-itau-flowID': flowId,
          'x-itau-apikey': this.apiKey,
          'x-itau-appid': this.appId,
          'x-itau-correlationID': flowId,
          Authorization: `Bearer ${accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Error calling Itaú API:', error)

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || error.message
        throw new Error(`Itaú API error (${status}): ${message}`)
      }

      throw error
    }
  }

  private generateFlowId(): string {
    return (
      'flow_' +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36)
    )
  }
}
