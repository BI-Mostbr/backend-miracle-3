import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

export class SantanderAuthService {
  private readonly client_secret: string
  private readonly authUrl: string
  private readonly axiosInstance: AxiosInstance

  constructor() {
    this.client_secret = process.env.SANTANDER_CLIENT_SECRET!
    this.authUrl = process.env.SANTANDER_AUTH_URL!
    this.axiosInstance = this.createAxiosInstance()
  }

  private createAxiosInstance(): AxiosInstance {
    try {
      const config: any = {
        timeout: 30000,
        headers: {
          'User-Agent': 'Santander-Auth-Client/1.0'
        }
      }

      return axios.create(config)
    } catch (error) {
      console.error('Erro ao configurar auth client:', error)
      return axios.create({
        timeout: 30000,
        headers: {
          'User-Agent': 'Itau-Auth-Client/1.0'
        }
      })
    }
  }

  async getAccessToken(): Promise<string> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      client_secret: this.client_secret
    }
    const bodyParams = new URLSearchParams({
      enc: 'f9117ef19b3807780c04dc87bf114ba69f229a528aee2eab20f0b6fe9dcb0909bf113151b6d55525e378396c6f0356c6612314f47cc84744a4641fa160442d157ecb4f0194664535be8fbf5be3e4357a9a81b144278c7dac089d8a3275a82ee299bfad3293202aab886e312dd6178cb5'
    })

    try {
      const response = await this.axiosInstance.post(
        this.authUrl,
        bodyParams.toString(),
        { headers }
      )

      const tokenData = response.data
      if (!tokenData.enc) {
        throw new Error('Access token não retornado pela API de autenticação')
      }

      return tokenData.enc
    } catch (error) {
      throw new Error('Falha na obtenção do Access token')
    }
  }
}
