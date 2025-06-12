import axios, { Axios, AxiosInstance } from 'axios'

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
}

export class InterAuthService {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly grantType: string
  private readonly scope: string
  private readonly authUrl: string
  private readonly axiosInstance: AxiosInstance

  constructor() {
    this.clientId = process.env.INTER_CLIENT_ID!
    this.clientSecret = process.env.INTER_CLIENT_SECRET!
    this.grantType = process.env.INTER_GRANT_TYPE!
    this.scope = process.env.INTER_SCOPE!
    this.authUrl = process.env.INTER_AUTH_URL!
    this.axiosInstance = this.createAxiosInstance()
  }

  private createAxiosInstance(): AxiosInstance {
    try {
      const config: any = {
        timeout: 30000,
        headers: {
          'User-Agent': 'Inter-Auth-Client/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      return axios.create(config)
    } catch (error) {
      throw new Error(`Erro ao criar instância do Axios: ${error}`)
    }
  }

  private async requestNewAccessToken(): Promise<string> {
    const bodyParams = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: this.grantType,
      scope: this.scope
    })

    try {
      const response = await this.axiosInstance.post(
        this.authUrl,
        bodyParams.toString()
      )
      const tokenData: TokenResponse = response.data
      if (!tokenData.access_token) {
        throw new Error('Access token não retornado pela API de autenticação')
      }
      return tokenData.access_token
    } catch (error) {
      throw new Error(`Erro ao solicitar novo access token: ${error}`)
    }
  }
}
