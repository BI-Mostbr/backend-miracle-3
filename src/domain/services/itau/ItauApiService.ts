import { IBankApiService } from '@infra/interfaces'
import { ItauAuthService } from './auth/itauAuthService'
import { ItauHttpClient } from './client/ItauHttp.client'
import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { ItauPayloadMapper } from './mappers/ItauPayload.mapper'
import { ItauResponseMapper } from './mappers/itauResponse.mapper'

export class ItauApiService implements IBankApiService {
  private readonly authService: ItauAuthService
  private readonly httpClient: ItauHttpClient

  constructor() {
    this.authService = new ItauAuthService()
    this.httpClient = new ItauHttpClient()

    console.log('🏦 ItauApiService inicializado com SigV4 Bearer Token')
    this.validateConfiguration()
  }

  private validateConfiguration(): void {
    // Verificar se todas as configurações necessárias estão presentes
    if (!this.authService.hasCredentials()) {
      throw new Error('Credenciais do Itaú não configuradas corretamente')
    }

    console.log('✅ Configuração do Itaú validada')
  }

  getBankName(): string {
    return 'itau'
  }

  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    console.log('🚀 Iniciando simulação de crédito no Itaú...')

    try {
      // Passo 1: Obter access token via SigV4
      console.log('📝 Etapa 1: Obtendo access token...')
      const accessToken = await this.authService.getAccessToken()
      console.log('✅ Access token obtido com sucesso')

      // Passo 2: Converter dados para formato esperado pelo Itaú
      console.log('📝 Etapa 2: Convertendo dados da simulação...')
      const itauPayload = ItauPayloadMapper.convertToPayload(simulation)
      console.log('✅ Payload do Itaú preparado')

      // Passo 3: Fazer requisição de simulação com Bearer Token
      console.log('📝 Etapa 3: Enviando requisição de simulação...')
      const itauResponse = await this.httpClient.simulateCredit(
        itauPayload,
        accessToken
      )
      console.log('✅ Resposta da simulação recebida')

      // Passo 4: Converter resposta para formato interno
      console.log('📝 Etapa 4: Convertendo resposta...')
      const internApiResponse =
        ItauResponseMapper.convertToInternApiResponse(itauResponse)
      console.log('✅ Simulação do Itaú processada com sucesso')

      return internApiResponse
    } catch (error) {
      console.error(`❌ Erro na simulação do ${this.getBankName()}:`, error)

      // Tratamento específico de erros
      if (error instanceof Error) {
        if (error.message.includes('Bearer token inválido')) {
          console.log('🔄 Tentando renovar token e repetir a operação...')
          try {
            // Forçar renovação do token e tentar novamente
            await this.authService.refreshToken()
            const newAccessToken = await this.authService.getAccessToken()
            const itauPayload = ItauPayloadMapper.convertToPayload(simulation)
            const retryResponse = await this.httpClient.simulateCredit(
              itauPayload,
              newAccessToken
            )
            const retryInternResponse =
              ItauResponseMapper.convertToInternApiResponse(retryResponse)

            console.log(
              '✅ Simulação realizada com sucesso após renovação do token'
            )
            return retryInternResponse
          } catch (retryError) {
            console.error('❌ Erro mesmo após renovação do token:', retryError)
            throw new Error(
              `Falha na simulação do Itaú mesmo após renovação do token: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            )
          }
        }

        // Outros tipos de erro
        throw new Error(
          `${this.getBankName()} simulation failed: ${error.message}`
        )
      }

      throw new Error(
        `${this.getBankName()} simulation failed: ${String(error)}`
      )
    }
  }

  // Método para verificar se o serviço está funcionando
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Verificando saúde do serviço Itaú...')

      // Verificar autenticação
      const hasCredentials = this.authService.hasCredentials()
      if (!hasCredentials) {
        console.error('❌ Credenciais não configuradas')
        return false
      }

      // Verificar conectividade
      const isConnected = await this.httpClient.healthCheck()
      if (!isConnected) {
        console.error('❌ Problema de conectividade')
        return false
      }

      // Verificar se consegue obter token
      try {
        await this.authService.getAccessToken()
        console.log('✅ Serviço Itaú está saudável')
        return true
      } catch (authError) {
        console.error('❌ Problema na autenticação:', authError)
        return false
      }
    } catch (error) {
      console.error('❌ Erro no health check:', error)
      return false
    }
  }

  // Método para debug completo do serviço
  async debugService(): Promise<void> {
    console.log('\n🔍 DEBUG COMPLETO DO SERVIÇO ITAÚ:')
    console.log('===================================')

    // Debug da autenticação
    this.authService.debugAuth()

    // Debug do HTTP client
    this.httpClient.debugHttpClient()

    // Verificar saúde
    const isHealthy = await this.healthCheck()
    console.log(
      `🏥 Status do serviço: ${isHealthy ? '✅ Saudável' : '❌ Com problemas'}`
    )

    // Informações do token
    const tokenInfo = this.authService.getTokenInfo()
    console.log(`🎫 Informações do token:`, tokenInfo)
  }

  // Método para forçar renovação de credenciais
  async refreshCredentials(): Promise<void> {
    console.log('🔄 Forçando renovação das credenciais...')
    await this.authService.refreshToken()
    console.log('✅ Credenciais renovadas')
  }
}
