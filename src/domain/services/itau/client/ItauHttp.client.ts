import axios, { AxiosInstance } from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { ItauApiPayload } from '../types/itauApiTypes'

export class ItauHttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.ITAU_API_URL!
    this.axiosInstance = this.createAxiosInstanceWithCerts()

    console.log('🌐 ItauHttpClient inicializado (Bearer Token Auth)')
    console.log(`   Base URL: ${this.baseUrl}`)

    if (!this.baseUrl) {
      console.error('❌ ITAU_API_URL não configurado!')
      throw new Error('ITAU_API_URL é obrigatório')
    }
  }

  private createAxiosInstanceWithCerts(): AxiosInstance {
    try {
      // Caminhos dos certificados
      const certsPath = path.join(process.cwd(), 'certs', 'itau')
      const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
      const certPath = path.join(certsPath, 'Certificado_itau.crt')

      // Verificar se os arquivos existem
      const keyExists = fs.existsSync(keyPath)
      const certExists = fs.existsSync(certPath)

      console.log('🔒 Configurando certificados para HTTP client:')
      console.log(`   Key: ${keyExists ? '✅' : '❌'} (${keyPath})`)
      console.log(`   Cert: ${certExists ? '✅' : '❌'} (${certPath})`)

      // Configuração base do axios
      const config: any = {
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-API-Client/1.0'
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
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Itau-API-Client/1.0'
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

    console.log('📤 Enviando simulação com Bearer Token...')

    // Headers com Bearer Token authentication
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId
    }

    console.log('📋 Headers da requisição:')
    console.log(
      JSON.stringify(
        {
          ...headers,
          Authorization: `Bearer ${accessToken.substring(0, 20)}...` // Mascarar token nos logs
        },
        null,
        2
      )
    )

    console.log('📦 Payload da simulação:')
    console.log(JSON.stringify(payload, null, 2))

    try {
      const response = await this.axiosInstance.post('/simulations', payload, {
        headers
      })

      console.log('✅ SUCESSO! Simulação processada pelo Itaú')
      console.log(`   Status: ${response.status}`)
      console.log(`   Headers de resposta:`)
      console.log(JSON.stringify(response.headers, null, 2))
      console.log(`   Dados da resposta:`)
      console.log(JSON.stringify(response.data, null, 2))

      return response.data
    } catch (error) {
      console.error('❌ Erro na simulação do Itaú:')

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data
        const responseHeaders = error.response?.headers

        console.error(`   Status: ${status}`)
        console.error(`   Response Headers:`)
        console.error(JSON.stringify(responseHeaders, null, 2))
        console.error(`   Response Data:`)
        console.error(JSON.stringify(data, null, 2))

        // Análise específica por status de erro
        if (status === 401) {
          console.error('\n💡 ERRO 401 - Token inválido:')
          console.error('   - Bearer token pode estar expirado')
          console.error('   - Bearer token pode estar inválido')
          console.error(
            '   - Bearer token pode não ter as permissões necessárias'
          )
          console.error('   - Tente renovar o token de autenticação')

          throw new Error(
            'Bearer token inválido ou expirado - renovação necessária'
          )
        } else if (status === 400) {
          console.error('\n💡 ERRO 400 - Dados da simulação inválidos:')
          console.error(
            '   - Verifique se todos os campos obrigatórios estão presentes'
          )
          console.error('   - Verifique se os tipos de dados estão corretos')
          console.error(
            '   - Verifique se os valores estão dentro dos limites permitidos'
          )

          throw new Error(
            `Dados inválidos na simulação: ${data?.message || data?.error_description || 'Verifique os dados enviados'}`
          )
        } else if (status === 403) {
          console.error('\n💡 ERRO 403 - Acesso negado:')
          console.error('   - Token não tem permissão para simular crédito')
          console.error(
            '   - Cliente pode não estar autorizado para este produto'
          )

          throw new Error('Token não tem permissão para simulação de crédito')
        } else if (status === 422) {
          console.error('\n💡 ERRO 422 - Dados não processáveis:')
          console.error(
            '   - Dados estão corretos mas não podem ser processados'
          )
          console.error('   - Pode haver restrições de negócio específicas')

          throw new Error(
            `Dados não processáveis: ${data?.message || data?.error_description || 'Verifique as regras de negócio'}`
          )
        } else if (status === 429) {
          console.error('\n💡 ERRO 429 - Rate limit excedido:')
          console.error('   - Muitas requisições em pouco tempo')
          console.error('   - Aguarde antes de tentar novamente')

          throw new Error(
            'Rate limit excedido - aguarde antes de tentar novamente'
          )
        } else if (status === 500) {
          console.error('\n💡 ERRO 500 - Erro interno do Itaú:')
          console.error('   - Problema no servidor do Itaú')
          console.error('   - Tente novamente em alguns minutos')

          throw new Error(
            'Erro interno do servidor do Itaú - tente novamente mais tarde'
          )
        } else if (status === 503) {
          console.error('\n💡 ERRO 503 - Serviço indisponível:')
          console.error('   - API do Itaú temporariamente indisponível')
          console.error('   - Manutenção programada ou sobrecarga')

          throw new Error('Serviço do Itaú temporariamente indisponível')
        }

        // Erro genérico
        throw new Error(
          `Erro na API do Itaú (${status}): ${data?.message || data?.error_description || 'Erro desconhecido'}`
        )
      }

      // Erro de rede
      console.error(
        '   Erro de rede:',
        error instanceof Error ? error.message : String(error)
      )
      throw new Error(
        `Erro de rede na comunicação com o Itaú: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Método para fazer requisições autenticadas genéricas
  async makeAuthenticatedRequest(
    endpoint: string,
    payload: any,
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<any> {
    const flowId = this.generateFlowId()
    const correlationId = this.generateCorrelationId()

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-itau-correlationID': correlationId,
      'x-itau-flowID': flowId
    }

    console.log(`📤 Fazendo requisição ${method} para ${endpoint}`)

    try {
      let response
      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get(endpoint, { headers })
          break
        case 'POST':
          response = await this.axiosInstance.post(endpoint, payload, {
            headers
          })
          break
        case 'PUT':
          response = await this.axiosInstance.put(endpoint, payload, {
            headers
          })
          break
        case 'DELETE':
          response = await this.axiosInstance.delete(endpoint, { headers })
          break
      }

      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`)
      return response.data
    } catch (error) {
      console.error(`❌ Erro em ${method} ${endpoint}:`, error)
      throw error
    }
  }

  private generateFlowId(): string {
    return `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Método para debug completo
  public debugHttpClient(): void {
    console.log('\n🔍 DEBUG HTTP CLIENT:')
    console.log('=====================')
    console.log(`📍 Base URL: ${this.baseUrl}`)
    console.log(
      `📜 Certificados: ${this.hasCertificates() ? 'Configurados' : 'Não configurados'}`
    )
    console.log(`⏱️  Timeout: ${this.axiosInstance.defaults.timeout}ms`)
    console.log(`📋 Headers padrão:`)
    console.log(JSON.stringify(this.axiosInstance.defaults.headers, null, 2))
  }

  // Método para verificar se certificados estão configurados
  public hasCertificates(): boolean {
    const certsPath = path.join(process.cwd(), 'certs', 'itau')
    const keyPath = path.join(certsPath, 'NOVO_CERTIFICADO.key')
    const certPath = path.join(certsPath, 'Certificado_itau.crt')

    return fs.existsSync(keyPath) && fs.existsSync(certPath)
  }

  // Método para verificar saúde da conexão (sem autenticação)
  public async healthCheck(): Promise<boolean> {
    try {
      // Tentar fazer uma requisição simples para verificar conectividade
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000,
        validateStatus: () => true // Aceitar qualquer status para verificar conectividade
      })

      console.log(`🏥 Health check - Status: ${response.status}`)
      return response.status < 500 // Considera saudável se não for erro de servidor
    } catch (error) {
      console.error(
        '❌ Health check falhou:',
        error instanceof Error ? error.message : String(error)
      )
      return false
    }
  }
}
