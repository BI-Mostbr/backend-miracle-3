import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { CreditSimulationDomainService } from '@domain/services/CreditSimulationDomain.service'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankProposalApiService, IClientRepository } from '@infra/interfaces'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'

export interface ProposalResult {
  bankName: string
  success: boolean
  proposalId?: string
  proposalNumber?: string
  error?: string
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

    // Validação das regras de negócio usando dados convertidos
    const legacyProposal = this.convertToLegacyFormat(proposal)
    if (!CreditSimulationDomainService.validateBusinessRules(legacyProposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    const bankService = this.findBankService(bankName)
    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
      // Enviar proposta para o banco
      const bankResponse = await bankService.sendProposal(proposal)

      // Save client data only after a successful proposal
      clientId = await this.executeFlowLogic(proposal)

      // Salvar proposta do banco
      await this.saveBankProposal(proposal, bankResponse, bankName)

      // Se for fluxo de adicionar banco, atualizar cliente
      if (proposal.fluxo === 'adicionar-banco') {
        await this.clientRepository.updateBankProposal(
          CreditProposalMapper.getCleanCpf(proposal),
          bankName,
          bankResponse.proposalId
        )
      }

      results.push({
        bankName,
        success: true,
        proposalId: bankResponse.proposalId,
        proposalNumber: bankResponse.proposalNumber
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

    return {
      success: results.every((r) => r.success),
      results,
      clientId,
      flowType: proposal.fluxo
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
    const legacyProposal = this.convertToLegacyFormat(proposal)
    if (!CreditSimulationDomainService.validateBusinessRules(legacyProposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
      // Enviar para cada banco
      for (const bankName of bankNames) {
        try {
          const bankService = this.findBankService(bankName)

          console.log(`📤 Enviando proposta para ${bankName}...`)
          const bankResponse = await bankService.sendProposal(proposal)

          if (!clientId) {
            // Save client data only once after first successful proposal
            clientId = await this.executeFlowLogic(proposal)
            console.log(
              `💾 Cliente e detalhes salvos após sucesso no primeiro banco`
            )
          }

          // Salvar proposta do banco
          await this.saveBankProposal(proposal, bankResponse, bankName)

          // Se for fluxo de adicionar banco, atualizar cliente
          if (proposal.fluxo === 'adicionar-banco') {
            await this.clientRepository.updateBankProposal(
              CreditProposalMapper.getCleanCpf(proposal),
              bankName,
              bankResponse.proposalId
            )
          }

          results.push({
            bankName,
            success: true,
            proposalId: bankResponse.proposalId,
            proposalNumber: bankResponse.proposalNumber
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
    } catch (error) {
      console.error(`❌ Erro no fluxo principal:`, error)
      // Se erro no fluxo principal, marcar todos os bancos como erro
      for (const bankName of bankNames) {
        results.push({
          bankName,
          success: false,
          error:
            error instanceof Error ? error.message : 'Erro no fluxo principal'
        })
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      clientId,
      flowType: proposal.fluxo
    }
  }

  private async executeFlowLogic(
    proposal: CreditProposal
  ): Promise<bigint | undefined> {
    let clientId: bigint | undefined

    switch (proposal.fluxo) {
      case 'normal':
        console.log(`📋 Executando fluxo NORMAL`)
        // Converter para formato legado e salvar cliente
        const legacyProposal = this.convertToLegacyFormat(proposal)
        const clientData = await this.clientRepository.save(legacyProposal)
        clientId = clientData.id

        if (clientId) {
          await this.clientRepository.saveDetails(legacyProposal, clientId)
          console.log(`💾 Cliente e detalhes salvos no fluxo normal`)
        }
        break

      case 'reenvio':
        console.log(`📋 Executando fluxo REENVIO`)
        // Buscar cliente existente
        const existingClient = await this.clientRepository.findByCpf(
          CreditProposalMapper.getCleanCpf(proposal)
        )
        clientId = existingClient?.id
        console.log(`🔍 Cliente existente encontrado para reenvio: ${clientId}`)
        break

      case 'adicionar-banco':
        console.log(`📋 Executando fluxo ADICIONAR-BANCO`)
        // Buscar cliente existente
        const existingClientForUpdate = await this.clientRepository.findByCpf(
          CreditProposalMapper.getCleanCpf(proposal)
        )
        clientId = existingClientForUpdate?.id
        console.log(
          `🔍 Cliente existente encontrado para adicionar banco: ${clientId}`
        )
        break

      default:
        throw new Error(`Tipo de fluxo inválido: ${proposal.fluxo}`)
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
          await itauRepo.save(proposal, bankResponse, proposal.fluxo)
          break

        case 'inter':
          const interRepo = RepositoryFactory.createInterProposalRepository()
          await interRepo.save(proposal, bankResponse, proposal.fluxo)
          break

        // Adicionar outros bancos conforme necessário
        // case 'santander':
        //   const santanderRepo = RepositoryFactory.createSantanderProposalRepository()
        //   await santanderRepo.save(proposal, bankResponse, proposal.fluxo)
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

  // Converte o novo formato CreditProposal para o formato legado para compatibilidade
  private convertToLegacyFormat(proposal: CreditProposal): any {
    return {
      customerCpf: CreditProposalMapper.getCleanCpf(proposal),
      customerName: proposal.name,
      customerBirthDate: proposal.birthday,
      customerEmail: proposal.email,
      customerPhone: CreditProposalMapper.getCleanPhone(proposal),
      customerMotherName: proposal.motherName,
      customerGender: proposal.gender,
      customerMaritalStatus: proposal.maritalStatus,
      customerProfession: proposal.profession,
      customerIncomeType: proposal.workType,
      customerIncome: CreditProposalMapper.getMonthlyIncomeAsNumber(proposal),
      customerWorkRegime: proposal.workType,

      documentType: proposal.documentType,
      documentNumber: proposal.documentNumber,
      documentIssuer: proposal.documentIssuer,
      documentIssueDate: proposal.documentIssueDate,
      documentUf: proposal.ufDataUser,

      customerAddress: {
        zipCode: proposal.userAddress.cep.replace(/\D/g, ''),
        street: proposal.userAddress.logradouro,
        number: proposal.userAddress.number,
        complement: proposal.userAddress.complement,
        neighborhood: proposal.userAddress.bairro,
        city: proposal.userAddress.localidade,
        state: proposal.userAddress.uf,
        addressType: 'RESIDENTIAL'
      },

      productType: proposal.selectedProductOption,
      propertyType: proposal.propertyType,
      propertyValue: CreditProposalMapper.getPropertyValueAsNumber(proposal),
      financingValue: CreditProposalMapper.getFinancedValueAsNumber(proposal),
      downPayment: CreditProposalMapper.getDownPayment(proposal),
      installments: CreditProposalMapper.getTermAsNumber(proposal),
      amortizationType: proposal.amortization.toUpperCase(),
      financingRate: proposal.financingRate,
      propertyState: proposal.uf,
      propertyCity: proposal.cities,
      useFgts: proposal.useFGTS,
      fgtsValue: CreditProposalMapper.getFgtsValueAsNumber(proposal),
      useItbi: proposal.itbiPayment,
      itbiValue: CreditProposalMapper.getItbiValueAsNumber(proposal),

      flowType: proposal.fluxo,
      userId: proposal.userId || 1,
      consultorId: proposal.consultorId,
      partnerId: proposal.selectedPartnerOption
    }
  }
}
