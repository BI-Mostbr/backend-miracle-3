import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankProposalApiService } from '@infra/interfaces'
import { IProposalClientRepository } from '@infra/interfaces/ProposalClientRepository.interface'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import { ItauApiService } from '@domain/services/itau/ItauApiService'
import { ItauProposalDetailsMapper } from '@domain/services/itau/mappers/ItauProposalDetails.mapper'
import { ItauProposalDetails } from '@infra/interfaces/ItauProposalDetails.interface'
import { ProposalDomainService } from '@domain/services/ProposalDomain.service'
import { SantanderProposalDetailsMapper } from '@domain/services/santander/mappers/SantanderProposalDetails.mapper'

export interface ProposalResult {
  bankName: string
  success: boolean
  proposalId?: string
  proposalNumber?: string
  error?: string
  adjustments?: any[] // NOVO: Ajustes aplicados
  originalFinancedValue?: string // NOVO: Valor original antes do ajuste
  adjustedFinancedValue?: string // NOVO: Valor após ajuste
}

export interface SendProposalResult {
  success: boolean
  results: ProposalResult[]
  clientId?: bigint
  flowType: string
  totalAdjustments?: number // NOVO: Total de ajustes aplicados
  summary?: string // NOVO: Resumo das operações
}

export class SendProposalUseCase {
  constructor(
    private bankServices: IBankProposalApiService[],
    private proposalClientRepository: IProposalClientRepository
  ) {}

  async sendToSpecificBank(
    proposal: CreditProposal,
    bankName: string
  ): Promise<SendProposalResult> {
    // 1. Validação básica
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    // 2. Validação e ajuste específico do banco
    const validationResult = ProposalDomainService.validateAndAdjustForBank(
      proposal,
      bankName
    )

    if (!validationResult.success) {
      throw new Error(
        `Proposta não atende às regras do ${bankName}: ${validationResult.errors.join(', ')}`
      )
    }

    // 3. Guardar valores originais para comparação
    const originalFinancedValue = proposal.financedValue

    // 4. Usar a proposta ajustada para envio
    const adjustedProposal = validationResult.adjustedProposal || proposal
    const bankService = this.findBankService(bankName)
    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
      // 5. Enviar proposta ajustada para o banco
      const bankResponse = await bankService.sendProposal(adjustedProposal)

      clientId = await this.executeFlowLogic(adjustedProposal)

      await this.saveBankProposal(
        adjustedProposal,
        bankResponse,
        bankName,
        clientId
      )

      if (
        adjustedProposal.fluxo === 'normal' ||
        adjustedProposal.fluxo === 'adicionar-banco'
      ) {
        const bankProposalIdentifier =
          bankResponse.proposalNumber || bankResponse.proposalId
        await this.proposalClientRepository.updateBankProposal(
          CreditProposalMapper.getCleanCpf(adjustedProposal),
          bankName,
          bankProposalIdentifier
        )
      }

      // 6. Incluir informações de ajuste no resultado
      results.push({
        bankName,
        success: true,
        proposalId: bankResponse.proposalId,
        proposalNumber: bankResponse.proposalNumber,
        adjustments: validationResult.adjustments || [],
        originalFinancedValue: originalFinancedValue,
        adjustedFinancedValue: adjustedProposal.financedValue
      })

      return {
        success: true,
        results,
        clientId,
        flowType: adjustedProposal.fluxo,
        totalAdjustments: validationResult.adjustments?.length || 0,
        summary:
          validationResult.adjustments?.length > 0
            ? `Proposta enviada com ${validationResult.adjustments.length} ajuste(s)`
            : 'Proposta enviada sem ajustes'
      }
    } catch (error) {
      results.push({
        bankName,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        adjustments: validationResult.adjustments || [],
        originalFinancedValue: originalFinancedValue,
        adjustedFinancedValue: adjustedProposal.financedValue
      })

      return {
        success: false,
        results,
        clientId,
        flowType: adjustedProposal.fluxo,
        totalAdjustments: validationResult.adjustments?.length || 0,
        summary: 'Erro no envio da proposta'
      }
    }
  }

  async sendToMultipleBanks(
    proposal: CreditProposal,
    bankNames: string[]
  ): Promise<SendProposalResult> {
    // 1. Validação básica
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    // 2. Validação e ajuste para múltiplos bancos
    const multiValidation =
      ProposalDomainService.validateAndAdjustForMultipleBanks(
        proposal,
        bankNames
      )

    if (!multiValidation.canProceed) {
      throw new Error(
        `Proposta não pode prosseguir: ${multiValidation.errors.join(', ')}`
      )
    }

    const results: ProposalResult[] = []
    let clientId: bigint | undefined
    let totalAdjustments = 0

    // 3. Enviar para cada banco válido usando a proposta ajustada específica
    for (const bankName of multiValidation.validBanks) {
      try {
        const bankService = this.findBankService(bankName)
        const adjustedProposal = multiValidation.adjustedProposals[bankName]
        const bankAdjustments =
          multiValidation.results[bankName]?.adjustments || []

        // Executar lógica de fluxo apenas uma vez
        if (!clientId) {
          clientId = await this.executeFlowLogic(adjustedProposal)
        }

        const bankResponse = await bankService.sendProposal(adjustedProposal)

        await this.saveBankProposal(
          adjustedProposal,
          bankResponse,
          bankName,
          clientId
        )

        if (
          adjustedProposal.fluxo === 'normal' ||
          adjustedProposal.fluxo === 'adicionar-banco'
        ) {
          const bankProposalIdentifier =
            bankResponse.proposalNumber || bankResponse.proposalId
          await this.proposalClientRepository.updateBankProposal(
            CreditProposalMapper.getCleanCpf(adjustedProposal),
            bankName,
            bankProposalIdentifier
          )
        }

        totalAdjustments += bankAdjustments.length

        results.push({
          bankName,
          success: true,
          proposalId: bankResponse.proposalId,
          proposalNumber: bankResponse.proposalNumber,
          adjustments: bankAdjustments,
          originalFinancedValue: proposal.financedValue,
          adjustedFinancedValue: adjustedProposal.financedValue
        })
      } catch (error) {
        console.error(`Erro ao enviar proposta para ${bankName}:`, error)
        const bankAdjustments =
          multiValidation.results[bankName]?.adjustments || []
        totalAdjustments += bankAdjustments.length

        results.push({
          bankName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          adjustments: bankAdjustments,
          originalFinancedValue: proposal.financedValue,
          adjustedFinancedValue:
            multiValidation.adjustedProposals[bankName]?.financedValue ||
            proposal.financedValue
        })
      }
    }

    // 4. Adicionar bancos rejeitados aos resultados
    multiValidation.invalidBanks.forEach((bankName) => {
      const bankErrors = multiValidation.errors
        .filter((error) => error.startsWith(`${bankName}:`))
        .map((error) => error.replace(`${bankName}: `, ''))
        .join(', ')

      results.push({
        bankName,
        success: false,
        error: bankErrors || 'Proposta não atende aos critérios do banco',
        adjustments: [],
        originalFinancedValue: proposal.financedValue,
        adjustedFinancedValue: proposal.financedValue
      })
    })

    return {
      success: results.some((r) => r.success),
      results,
      clientId,
      flowType: proposal.fluxo,
      totalAdjustments,
      summary: `${multiValidation.validBanks.length}/${bankNames.length} banco(s) aprovaram. ${totalAdjustments} ajuste(s) aplicado(s)`
    }
  }

  private async executeFlowLogic(
    proposal: CreditProposal
  ): Promise<bigint | undefined> {
    let clientId: bigint | undefined

    switch (proposal.fluxo) {
      case 'normal':
        const clientData = await this.proposalClientRepository.save(proposal)
        clientId = clientData.id

        if (clientId) {
          await this.proposalClientRepository.saveDetails(proposal, clientId)
        }
        break

      case 'reenvio':
        const existingClient = await this.proposalClientRepository.findByCpf(
          CreditProposalMapper.getCleanCpf(proposal)
        )
        clientId = existingClient?.id
        break

      case 'adicionar-banco':
        const existingClientForUpdate =
          await this.proposalClientRepository.findByCpf(
            CreditProposalMapper.getCleanCpf(proposal)
          )
        clientId = existingClientForUpdate?.id
        break

      default:
        throw new Error(`Tipo de fluxo inválido: ${proposal.fluxo}`)
    }

    return clientId
  }

  private async saveBankProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    bankName: string,
    clientId?: bigint
  ): Promise<void> {
    try {
      switch (bankName.toLowerCase()) {
        case 'itau':
          await this.saveItauProposal(proposal, bankResponse, clientId)
          break

        case 'inter':
          await this.saveInterProposal(proposal, bankResponse)
          break

        case 'santander':
          await this.saveSantanderProposal(proposal, bankResponse, clientId)
          break

        default:
          console.warn(
            `⚠️ Repositório não implementado para o banco: ${bankName}`
          )
          break
      }
    } catch (error) {
      throw error
    }
  }

  private async saveItauProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    clientId?: bigint
  ): Promise<void> {
    const itauService = this.findBankService('itau') as ItauApiService
    const itauRepo = RepositoryFactory.createItauProposalRepository()
    const deParaRepo = RepositoryFactory.createDeParaRepository()

    try {
      const proposalDetails = await itauService.getProposalDetails(
        bankResponse.proposalNumber!
      )
      const mappedDetails = await ItauProposalDetailsMapper.mapFromItauResponse(
        proposalDetails,
        proposal,
        deParaRepo,
        clientId
      )
      await itauRepo.save(mappedDetails, clientId)
    } catch (error) {
      const basicDetails: ItauProposalDetails = {
        id_proposta: bankResponse.proposalNumber || bankResponse.proposalId,
        status_global: 'ENVIADO',
        id_cliente_most: clientId || null,
        id_status_most: null,
        id_situacao_most: null,
        proposal_uuid: bankResponse.proposalId,
        proposta_copiada: false,
        id_produto: this.getProductIdForItau(proposal.selectedProductOption)
      }

      await itauRepo.save(basicDetails, clientId)
    }
  }

  private async saveInterProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse
  ): Promise<void> {
    const interRepo = RepositoryFactory.createInterProposalRepository()
    await interRepo.save(proposal, bankResponse, proposal.fluxo)
  }

  private async saveSantanderProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    clientId?: bigint
  ): Promise<void> {
    console.log('chamando save tb_santander')
    const sanatanderRepo = RepositoryFactory.createSantanderProposalRepository()
    const deParaRepo = RepositoryFactory.createDeParaRepository()
    const santanderdetails =
      await SantanderProposalDetailsMapper.mapFromSantanderResponse(
        bankResponse,
        proposal,
        deParaRepo,
        clientId
      )
    console.log(santanderdetails)
    await sanatanderRepo.save(santanderdetails, clientId)
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

  private getProductIdForItau(productOption: string): bigint {
    const productMap: { [key: string]: bigint } = {
      ISOLADO: BigInt(1),
      PILOTO: BigInt(2),
      REPASSE: BigInt(3),
      PORTABILIDADE: BigInt(4)
    }
    return productMap[productOption] || BigInt(1)
  }
}
