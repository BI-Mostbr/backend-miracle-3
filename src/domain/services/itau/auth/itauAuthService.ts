import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

export class ItauAuthService {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly authUrl: string
  private readonly axiosInstance: AxiosInstance
  private cachedToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor() {
    this.clientId = process.env.ITAU_CLIENT_ID!
    this.clientSecret = process.env.ITAU_CLIENT_SECRET!
    this.authUrl = process.env.ITAU_AUTH_URL!
    this.axiosInstance = this.createAxiosInstanceWithCerts()
    this.validateRequiredEnvVars()
  }

  private validateRequiredEnvVars(): void {
    const missing: string[] = []

    if (!this.clientId) missing.push('ITAU_CLIENT_ID')
    if (!this.clientSecret) missing.push('ITAU_CLIENT_SECRET')
    if (!this.authUrl) missing.push('ITAU_AUTH_URL')

    if (missing.length > 0) {
      console.error('Variáveis de ambiente obrigatórias não configuradas:')
      missing.forEach((env) => console.error(`   - ${env}`))
      throw new Error(
        `Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`
      )
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
        timeout: 30000,
        headers: {
          'User-Agent': 'Itau-Auth-Client/1.0'
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
        console.log('Auth client configurado com certificados')
      } else {
        console.warn('Auth client sem certificados')
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
    if (this.cachedToken && this.isTokenValid()) {
      console.log('Usando token em cache (ainda válido)')
      return this.cachedToken
    }

    console.log('Solicitando novo access token...')
    return await this.requestNewToken()
  }

  private async requestNewToken(): Promise<string> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-itau-flowID': flowId,
      'x-itau-correlationID': correlationId
    }
    const bodyParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    })

    try {
      const response = await this.axiosInstance.post(
        this.authUrl,
        bodyParams.toString(),
        { headers }
      )

      const tokenData: TokenResponse = response.data
      if (!tokenData.access_token) {
        throw new Error('Access token não retornado pela API de autenticação')
      }
      this.cachedToken = tokenData.access_token
      const expiresInMs = (tokenData.expires_in || 3600) * 1000

      this.tokenExpiresAt = Date.now() + expiresInMs - 5 * 60 * 1000
      return this.cachedToken
    } catch (error) {
      console.error('Erro na autenticação SigV4:')

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data
        const responseHeaders = error.response?.headers

        console.error(`   Status: ${status}`)
        console.error(
          `Response Headers:`,
          JSON.stringify(responseHeaders, null, 2)
        )
        console.error(`Response Data:`, JSON.stringify(data, null, 2))
        if (status === 400) {
          console.error('\n💡 ERRO 400 - Bad Request:')
          console.error(
            '   - Verifique se grant_type está correto (client_credentials)'
          )
          console.error(
            '   - Verifique se client_id e client_secret estão corretos'
          )
          console.error('   - Verifique se o Content-Type está correto')
          throw new Error(
            'Credenciais inválidas ou formato de requisição incorreto'
          )
        } else if (status === 401) {
          console.error('\n💡 ERRO 401 - Unauthorized:')
          console.error('   - Client ID ou Client Secret inválidos')
          console.error('   - Credenciais expiradas ou revogadas')
          throw new Error('Client ID ou Client Secret inválidos')
        } else if (status === 403) {
          console.error('\n💡 ERRO 403 - Forbidden:')
          console.error('   - Cliente não autorizado para este grant type')
          console.error('   - Escopo insuficiente')
          throw new Error(
            'Cliente não autorizado para client_credentials grant'
          )
        } else if (status === 429) {
          console.error('\n💡 ERRO 429 - Rate Limit:')
          console.error('   - Muitas tentativas de autenticação')
          throw new Error(
            'Rate limit excedido - aguarde antes de tentar novamente'
          )
        } else if (status === 500) {
          console.error('\n💡 ERRO 500 - Erro interno do Itaú')
          throw new Error('Erro interno do servidor de autenticação do Itaú')
        }

        throw new Error(
          `Erro de autenticação (${status}): ${data?.error_description || data?.message || 'Erro desconhecido'}`
        )
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('   Erro de rede ou configuração:', errorMessage)
      throw new Error(`Erro de rede na autenticação: ${errorMessage}`)
    }
  }

  private isTokenValid(): boolean {
    return Date.now() < this.tokenExpiresAt
  }

  private generateFlowId(): string {
    return `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  async refreshToken(): Promise<string> {
    console.log('🔄 Forçando renovação do token...')
    this.cachedToken = null
    this.tokenExpiresAt = 0
    return await this.getAccessToken()
  }

  public hasCredentials(): boolean {
    return !!(this.clientId && this.clientSecret && this.authUrl)
  }

  public getTokenInfo(): {
    hasToken: boolean
    expiresAt: string | null
    isValid: boolean
  } {
    return {
      hasToken: !!this.cachedToken,
      expiresAt: this.tokenExpiresAt
        ? new Date(this.tokenExpiresAt).toISOString()
        : null,
      isValid: this.isTokenValid()
    }
  }
}
