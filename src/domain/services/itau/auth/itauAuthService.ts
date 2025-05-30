import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

export class ItauAuthService {
  private readonly apiKey: string
  private readonly axiosInstance: AxiosInstance

  constructor() {
    // Para API Key auth, precisamos apenas da API Key
    this.apiKey = process.env.ITAU_API_KEY!
    this.axiosInstance = this.createAxiosInstanceWithCerts()

    console.log('🔐 ItauAuthService inicializado (API Key Auth)')
    console.log(
      `   API Key: ${this.apiKey ? `${this.apiKey.substring(0, 8)}...` : '❌ Não encontrado'}`
    )

    if (!this.apiKey) {
      console.error('❌ ITAU_API_KEY não configurado!')
      console.log('💡 Configure ITAU_API_KEY no seu .env')
    }
  }

  private createAxiosInstanceWithCerts(): AxiosInstance {
    try {
      const certsPath = path.join(process.cwd(), 'certs', 'itau')
      const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
      const certPath = path.join(certsPath, 'Certificado_itau.crt')

      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)

      console.log('🔒 Verificando certificados:')
      console.log(`   Key: ${keyExists ? '✅' : '❌'} (${keyPath})`)
      console.log(`   Cert: ${certExists ? '✅' : '❌'} (${certPath})`)

      if (!keyExists || !certExists) {
        console.warn(
          '⚠️ Certificados não encontrados, usando axios sem certificados'
        )
        return axios.create({
          timeout: 30000
        })
      }

      const key = fs.readFileSync(keyPath, 'utf8')
      const cert = fs.readFileSync(certPath, 'utf8')

      const httpsAgent = new https.Agent({
        key: key,
        cert: cert,
        rejectUnauthorized: true
      })

      console.log('✅ Certificados carregados com sucesso')
      return axios.create({
        httpsAgent: httpsAgent,
        timeout: 30000
      })
    } catch (error) {
      console.error('❌ Erro ao configurar certificados:', error)
      return axios.create({
        timeout: 30000
      })
    }
  }

  // Para API Key auth, não precisamos buscar token - apenas retornamos a API Key
  async getAccessToken(): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'API Key não configurada - configure ITAU_API_KEY no .env'
      )
    }

    console.log('🔑 Usando API Key para autenticação')
    return this.apiKey
  }

  // Método para fazer requisições autenticadas diretamente
  async makeAuthenticatedRequest(url: string, data: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API Key não configurada')
    }

    try {
      const response = await this.axiosInstance.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          auth: this.apiKey, // Header conforme documentação
          'x-itau-flowID': this.generateUUID(),
          'x-itau-correlationID': this.generateUUID()
        }
      })

      console.log('✅ Requisição autenticada com sucesso!')
      console.log(`   Status: ${response.status}`)

      return response.data
    } catch (error) {
      console.error('❌ Erro na requisição autenticada:', error)

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data

        console.error(`   Status: ${status}`)
        console.error(`   Response: ${JSON.stringify(data, null, 2)}`)

        if (status === 401) {
          throw new Error('API Key inválida ou não autorizada')
        } else if (status === 403) {
          throw new Error('API Key não tem permissão para este recurso')
        }
      }

      throw error
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }
    )
  }

  // Getter para verificar se API Key está configurada
  public hasApiKey(): boolean {
    return !!this.apiKey
  }

  // Getter para obter a instância do axios configurada
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }
}
