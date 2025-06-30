import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { CreditSimulationDomainService } from '@domain/services/CreditSimulationDomain.service'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankProposalApiService, IClientRepository } from '@infra/interfaces'

export interface ProposalResult {
  bankName: string
  success: boolean
  proposalId?: string
  proposalNumber?: string
  error?: string
  bankResponse?: BankProposalResponse // Adicionar resposta do banco para salvar depois
}

export interface SendProposalResult {
  success: boolean
  results: ProposalResult[]
  clientId?: bigint
  flowType: string
}

export class SendProposalUseCase {
  constructor(
    private bankServices: IBankProposalApiService[],
    private clientRepository: IClientRepository
  ) {}

  async sendToSpecificBank(
    proposal: CreditProposal,
    bankName: string
  ): Promise<SendProposalResult> {
    console.log(`🚀 Iniciando envio de proposta para ${bankName}`)

    // Validação das regras de negócio
    if (!CreditSimulationDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    const bankService = this.findBankService(bankName)
    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    // 1. PRIMEIRO: Tentar enviar para o banco
    try {
      console.log(`📤 Enviando proposta para ${bankName}...`)
      const bankResponse = await bankService.sendProposal(proposal)

      results.push({
        bankName,
        success: true,
        proposalId: bankResponse.proposalId,
        proposalNumber: bankResponse.proposalNumber,
        bankResponse: bankResponse // Guardar para salvar depois
      })

      console.log(`✅ Proposta enviada com sucesso para ${bankName}`)
    } catch (error) {
      console.error(`❌ Erro ao enviar proposta para ${bankName}:`, error)
      results.push({
        bankName,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // 2. DEPOIS: Se pelo menos um banco teve sucesso, executar lógica de persistência
    const hasSuccess = results.some((r) => r.success)

    if (hasSuccess) {
      try {
        // Executar fluxo baseado no tipo (salvar cliente, etc.)
        clientId = await this.executeFlowLogic(proposal)

        // Salvar propostas dos bancos que tiveram sucesso
        for (const result of results.filter(
          (r) => r.success && r.bankResponse
        )) {
          await this.saveBankProposal(
            proposal,
            result.bankResponse!,
            result.bankName
          )

          // Se for fluxo de adicionar banco, atualizar cliente
          if (proposal.flowType === 'adicionar-banco') {
            await this.clientRepository.updateBankProposal(
              proposal.customerCpf,
              result.bankName,
              result.proposalId!
            )
          }
        }

        console.log(
          `💾 Dados persistidos com sucesso - Cliente ID: ${clientId}`
        )
      } catch (error) {
        console.error(`❌ Erro ao persistir dados:`, error)
        // Se falhar ao persistir, marcar como erro mesmo que o envio tenha funcionado
        results.forEach((r) => {
          if (r.success) {
            r.success = false
            r.error = `Envio realizado mas falha na persistência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
      }
    } else {
      console.log(`⚠️ Nenhum banco teve sucesso - dados não serão persistidos`)
    }

    return {
      success: results.every((r) => r.success),
      results: results.map((r) => ({
        bankName: r.bankName,
        success: r.success,
        proposalId: r.proposalId,
        proposalNumber: r.proposalNumber,
        error: r.error
      })), // Remover bankResponse da resposta final
      clientId,
      flowType: proposal.flowType
    }
  }

  async sendToMultipleBanks(
    proposal: CreditProposal,
    bankNames: string[]
  ): Promise<SendProposalResult> {
    console.log(
      `🚀 Iniciando envio de proposta para múltiplos bancos: ${bankNames.join(', ')}`
    )

    // Validação das regras de negócio
    if (!CreditSimulationDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    // 1. PRIMEIRO: Tentar enviar para todos os bancos
    for (const bankName of bankNames) {
      try {
        const bankService = this.findBankService(bankName)

        console.log(`📤 Enviando proposta para ${bankName}...`)
        const bankResponse = await bankService.sendProposal(proposal)

        results.push({
          bankName,
          success: true,
          proposalId: bankResponse.proposalId,
          proposalNumber: bankResponse.proposalNumber,
          bankResponse: bankResponse // Guardar para salvar depois
        })

        console.log(`✅ Proposta enviada com sucesso para ${bankName}`)
      } catch (error) {
        console.error(`❌ Erro ao enviar proposta para ${bankName}:`, error)
        results.push({
          bankName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // 2. DEPOIS: Se pelo menos um banco teve sucesso, executar lógica de persistência
    const successfulResults = results.filter((r) => r.success)

    if (successfulResults.length > 0) {
      try {
        console.log(
          `📋 ${successfulResults.length} bancos tiveram sucesso. Persistindo dados...`
        )

        // Executar fluxo baseado no tipo (salvar cliente, etc.)
        clientId = await this.executeFlowLogic(proposal)

        // Salvar propostas dos bancos que tiveram sucesso
        for (const result of successfulResults) {
          await this.saveBankProposal(
            proposal,
            result.bankResponse!,
            result.bankName
          )

          // Se for fluxo de adicionar banco, atualizar cliente
          if (proposal.flowType === 'adicionar-banco') {
            await this.clientRepository.updateBankProposal(
              proposal.customerCpf,
              result.bankName,
              result.proposalId!
            )
          }
        }

        console.log(
          `💾 Dados persistidos com sucesso - Cliente ID: ${clientId}`
        )
        console.log(
          `✅ Resumo: ${successfulResults.length}/${bankNames.length} bancos com sucesso`
        )
      } catch (error) {
        console.error(`❌ Erro ao persistir dados:`, error)
        // Se falhar ao persistir, marcar todos os sucessos como erro
        results.forEach((r) => {
          if (r.success) {
            r.success = false
            r.error = `Envio realizado mas falha na persistência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
      }
    } else {
      console.log(`⚠️ Nenhum banco teve sucesso - dados não serão persistidos`)
    }

    return {
      success: results.some((r) => r.success), // Mudança: sucesso se pelo menos um banco funcionou
      results: results.map((r) => ({
        bankName: r.bankName,
        success: r.success,
        proposalId: r.proposalId,
        proposalNumber: r.proposalNumber,
        error: r.error
      })), // Remover bankResponse da resposta final
      clientId,
      flowType: proposal.flowType
    }
  }

  private async executeFlowLogic(
    proposal: CreditProposal
  ): Promise<bigint | undefined> {
    let clientId: bigint | undefined

    switch (proposal.flowType) {
      case 'normal':
        console.log(`📋 Executando fluxo NORMAL`)
        // Salvar cliente e detalhes
        const clientData = await this.clientRepository.save(proposal)
        clientId = clientData.id

        if (clientId) {
          await this.clientRepository.saveDetails(proposal, clientId)
          console.log(`💾 Cliente e detalhes salvos no fluxo normal`)
        }
        break

      case 'reenvio':
        console.log(`📋 Executando fluxo REENVIO`)
        // Buscar cliente existente
        const existingClient = await this.clientRepository.findByCpf(
          proposal.customerCpf
        )
        clientId = existingClient?.id
        console.log(`🔍 Cliente existente encontrado para reenvio: ${clientId}`)
        break

      case 'adicionar-banco':
        console.log(`📋 Executando fluxo ADICIONAR-BANCO`)
        // Buscar cliente existente
        const existingClientForUpdate = await this.clientRepository.findByCpf(
          proposal.customerCpf
        )
        clientId = existingClientForUpdate?.id
        console.log(
          `🔍 Cliente existente encontrado para adicionar banco: ${clientId}`
        )
        break

      default:
        throw new Error(`Tipo de fluxo inválido: ${proposal.flowType}`)
    }

    return clientId
  }

  private async saveBankProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    bankName: string
  ): Promise<void> {
    try {
      switch (bankName.toLowerCase()) {
        case 'itau':
          const itauRepo = RepositoryFactory.createItauProposalRepository()
          await itauRepo.save(proposal, bankResponse, proposal.flowType)
          break

        case 'inter':
          const interRepo = RepositoryFactory.createInterProposalRepository()
          await interRepo.save(proposal, bankResponse, proposal.flowType)
          break

        // Adicionar outros bancos conforme necessário
        // case 'santander':
        //   const santanderRepo = RepositoryFactory.createSantanderProposalRepository()
        //   await santanderRepo.save(proposal, bankResponse, proposal.flowType)
        //   break

        default:
          console.warn(
            `⚠️ Repositório não implementado para o banco: ${bankName}`
          )
          break
      }
    } catch (error) {
      console.error(
        `❌ Erro ao salvar proposta na tabela do ${bankName}:`,
        error
      )
      throw error
    }
  }

  private findBankService(bankName: string): IBankProposalApiService {
    const bankService = this.bankServices.find((service) => {
      const serviceName = service.getBankName().toLowerCase().trim()
      return serviceName === bankName.toLowerCase().trim()
    })

    if (!bankService) {
      throw new Error(`Serviço bancário para ${bankName} não encontrado`)
    }

    return bankService
  }
}
