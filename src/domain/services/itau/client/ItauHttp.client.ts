import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { ItauApiPayload } from '../types/itauApiTypes'

export class ItauHttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly apiKey: string
  private readonly appId: string

  constructor() {
    const baseURL = process.env.ITAU_API_URL!
    this.apiKey = process.env.ITAU_API_KEY!
    this.appId = process.env.ITAU_APP_ID!

    // Criar instância com certificados
    this.axiosInstance = this.createAxiosInstanceWithCerts(baseURL)

    console.log(
      '🌐 ItauHttpClient inicializado - Headers exatos da documentação'
    )
    console.log(`   Base URL: ${baseURL}`)
    console.log(
      `   API Key: ${this.apiKey ? `${this.apiKey.substring(0, 8)}...` : '❌ Não encontrado'}`
    )
    console.log(
      `   App ID: ${this.appId ? '✅ Definido' : '❌ Não encontrado'}`
    )

    // Validar API Key
    if (!this.apiKey) {
      console.error('❌ ITAU_API_KEY não configurado!')
      throw new Error('ITAU_API_KEY é obrigatório')
    }
  }

  private createAxiosInstanceWithCerts(baseURL: string): AxiosInstance {
    try {
      // Caminhos dos certificados
      const certsPath = path.join(process.cwd(), 'certs', 'itau')
      const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
      const certPath = path.join(certsPath, 'Certificado_itau.crt')

      // Verificar se os arquivos existem
      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)

      console.log('🔒 Configurando certificados:')
      console.log(`   Key: ${keyExists ? '✅' : '❌'} (${keyPath})`)
      console.log(`   Cert: ${certExists ? '✅' : '❌'} (${certPath})`)

      // Configuração base do axios
      const config: any = {
        baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      // Se temos certificados, configurar HTTPS agent
      if (keyExists && certExists) {
        const key = fs.readFileSync(keyPath, 'utf8')
        const cert = fs.readFileSync(certPath, 'utf8')
        const httpsAgent = new https.Agent({
          key: key,
          cert: cert,
          rejectUnauthorized: true
        })

        config.httpsAgent = httpsAgent
        console.log('✅ HTTP client configurado com certificados')
      } else {
        console.warn('⚠️ HTTP client sem certificados')
      }

      return axios.create(config)
    } catch (error) {
      console.error('❌ Erro ao configurar HTTP client:', error)

      // Fallback sem certificados
      return axios.create({
        baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
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

    console.log('📤 Enviando requisição com headers EXATOS da documentação...')
    console.log(`   API Key: ${accessToken.substring(0, 8)}...`)

    // Headers EXATOS conforme a documentação mostrada
    const headers = {
      'Content-Type': 'application/json', // Obrigatório
      'x-itau-apikey': accessToken, // Obrigatório
      'x-itau-correlationID': correlationId, // Obrigatório
      'x-itau-flowID': flowId // Obrigatório
    }

    console.log('📋 Headers (conforme documentação):')
    console.log(JSON.stringify(headers, null, 2))
    console.log('📦 Payload:')
    console.log(JSON.stringify(payload, null, 2))

    try {
      const response = await this.axiosInstance.post('/simulations', payload, {
        headers
      })

      console.log('✅ SUCESSO! Resposta recebida da API do Itaú')
      console.log(`   Status: ${response.status}`)
      console.log(`   Headers de resposta:`)
      console.log(JSON.stringify(response.headers, null, 2))
      console.log(`   Data:`)
      console.log(JSON.stringify(response.data, null, 2))

      return response.data
    } catch (error) {
      console.error('❌ Erro na API do Itaú:')

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || error.message
        const data = error.response?.data
        const responseHeaders = error.response?.headers

        console.error(`   Status: ${status}`)
        console.error(`   Message: ${message}`)
        console.error(`   Response Headers:`)
        console.error(JSON.stringify(responseHeaders, null, 2))
        console.error(`   Full Response:`)
        console.error(JSON.stringify(data, null, 2))

        // Análise detalhada do erro
        if (status === 401) {
          console.error('\n💡 ANÁLISE DO ERRO 401:')
          console.error('   1. ✅ Headers corretos conforme documentação')
          console.error(
            '   2. ❓ API Key pode estar inválida, expirada ou não autorizada'
          )
          console.error('   3. ❓ Certificados podem não estar autorizados')
          console.error(
            '   4. ❓ Ambiente pode estar incorreto (sandbox vs produção)'
          )

          console.error('\n🔍 VERIFICAÇÕES:')
          console.error(
            `   - API Key usada: ${accessToken.substring(0, 12)}...`
          )
          console.error(
            `   - URL chamada: ${this.axiosInstance.defaults.baseURL}/simulations`
          )
          console.error(
            `   - Certificados: ${this.hasCertificates() ? 'Configurados' : 'Não configurados'}`
          )

          throw new Error(
            'API Key inválida, expirada ou não autorizada para este recurso'
          )
        } else if (status === 400) {
          console.error('\n💡 Erro 400 - Dados da requisição inválidos')
          console.error('   Verifique se o payload está no formato correto')
          throw new Error(`Dados inválidos na simulação: ${message}`)
        } else if (status === 403) {
          console.error('\n💡 Erro 403 - Sem permissão')
          throw new Error('API Key não tem permissão para este recurso')
        } else if (status === 422) {
          console.error('\n💡 Erro 422 - Dados não processáveis')
          throw new Error(`Dados não processáveis: ${message}`)
        } else if (status === 500) {
          console.error('\n💡 Erro 500 - Problema interno do Itaú')
          throw new Error(`Erro interno do Itaú: ${message}`)
        }

        throw new Error(`Itaú API error (${status}): ${message}`)
      }

      throw error
    }
  }

  private generateFlowId(): string {
    // Gerar ID único para o fluxo - formato simples e limpo
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private generateCorrelationId(): string {
    // Gerar ID único para correlação - formato simples e limpo
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Método para debug completo
  public debugComplete(): void {
    console.log('\n🔍 DEBUG COMPLETO:')
    console.log('=================')
    console.log(`📍 Base URL: ${this.axiosInstance.defaults.baseURL}`)
    console.log(
      `🔑 API Key: ${this.apiKey ? `${this.apiKey.substring(0, 12)}...` : 'NÃO DEFINIDO'}`
    )
    console.log(
      `📜 Certificados: ${this.hasCertificates() ? 'Configurados' : 'Não configurados'}`
    )
    console.log(`⏱️  Timeout: ${this.axiosInstance.defaults.timeout}ms`)
    console.log(`📋 Headers padrão:`)
    console.log(JSON.stringify(this.axiosInstance.defaults.headers, null, 2))

    console.log('\n🎯 Próximos headers que serão enviados:')
    console.log(
      JSON.stringify(
        {
          'Content-Type': 'application/json',
          'x-itau-apikey': this.apiKey
            ? `${this.apiKey.substring(0, 12)}...`
            : 'NÃO DEFINIDO',
          'x-itau-correlationID': 'será_gerado_automaticamente',
          'x-itau-flowID': 'será_gerado_automaticamente'
        },
        null,
        2
      )
    )
  }

  // Método para verificar se está configurado com certificados
  public hasCertificates(): boolean {
    const certsPath = path.join(process.cwd(), 'certs', 'itau')
    const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
    const certPath = path.join(certsPath, 'Certificado_itau.crt')

    return fs.existsSync(keyPath) && fs.existsSync(certPath)
  }

  // Método para verificar se API Key está configurada
  public hasApiKey(): boolean {
    return !!this.apiKey
  }
}
