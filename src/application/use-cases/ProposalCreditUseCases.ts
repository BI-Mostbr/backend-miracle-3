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
import { decryptJasypt } from 'Utils/crypto'

export interface ProposalResult {
  bankName: string
  success: boolean
  proposalId?: string
  proposalNumber?: string
  error?: string
  adjustments?: any[]
  originalFinancedValue?: string
  adjustedFinancedValue?: string
}

export interface SendProposalResult {
  success: boolean
  results: ProposalResult[]
  clientId?: bigint
  flowType: string
  totalAdjustments?: number
  summary?: string
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
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    if (proposal.fluxo === 'normal') {
      const existingClient = await this.proposalClientRepository.findByCpf(
        CreditProposalMapper.getCleanCpf(proposal)
      )
      if (existingClient) {
        throw new Error(
          'CPF já está cadastrado. Use o fluxo "reenvio" ou "adicionar-banco".'
        )
      }
    }

    this.validateRequiredFields(proposal)

    const validationResult = ProposalDomainService.validateAndAdjustForBank(
      proposal,
      bankName
    )

    if (!validationResult.success) {
      throw new Error(
        `Proposta não atende às regras do ${bankName}: ${validationResult.errors.join(', ')}`
      )
    }
    const originalFinancedValue = proposal.financedValue

    const adjustedProposal = validationResult.adjustedProposal || proposal
    const bankService = this.findBankService(bankName)
    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
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

      let proposalId = bankResponse.proposalId
      if (bankName.toLowerCase() === 'santander' && bankResponse.simulationId) {
        try {
          proposalId = decryptJasypt(bankResponse.simulationId)
          console.log(
            '🔍 SimulationId descriptografado para frontend:',
            proposalId
          )
        } catch (error) {
          console.warn(
            'Erro ao descriptografar simulationId do Santander:',
            error
          )
          proposalId = bankResponse.proposalId
        }
      }

      results.push({
        bankName,
        success: true,
        proposalId: proposalId, // USAR O ID DESCRIPTOGRAFADO PARA SANTANDER
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
        clientId: undefined,
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
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    if (proposal.fluxo === 'normal') {
      const existingClient = await this.proposalClientRepository.findByCpf(
        CreditProposalMapper.getCleanCpf(proposal)
      )
      if (existingClient) {
        throw new Error(
          'CPF já está cadastrado. Use o fluxo "reenvio" ou "adicionar-banco".'
        )
      }
    }

    this.validateRequiredFields(proposal)

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
    let hasSuccessfulBank = false

    for (const bankName of multiValidation.validBanks) {
      try {
        const bankService = this.findBankService(bankName)
        const adjustedProposal = multiValidation.adjustedProposals[bankName]
        const bankAdjustments =
          multiValidation.results[bankName]?.adjustments || []

        const bankResponse = await bankService.sendProposal(adjustedProposal)

        hasSuccessfulBank = true

        if (!clientId) {
          clientId = await this.executeFlowLogic(adjustedProposal)
        }

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

        let proposalId = bankResponse.proposalId
        if (
          bankName.toLowerCase() === 'santander' &&
          bankResponse.simulationId
        ) {
          try {
            proposalId = decryptJasypt(bankResponse.simulationId)
            console.log(
              '🔍 SimulationId descriptografado para frontend:',
              proposalId
            )
          } catch (error) {
            console.warn(
              'Erro ao descriptografar simulationId do Santander:',
              error
            )
            proposalId = bankResponse.proposalId
          }
        }

        results.push({
          bankName,
          success: true,
          proposalId: proposalId,
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

    if (!hasSuccessfulBank) {
      return {
        success: false,
        results,
        clientId: undefined,
        flowType: proposal.fluxo,
        totalAdjustments,
        summary: `Nenhum banco aprovou a proposta. ${multiValidation.validBanks.length}/${bankNames.length} banco(s) tentados.`
      }
    }

    return {
      success: hasSuccessfulBank,
      results,
      clientId,
      flowType: proposal.fluxo,
      totalAdjustments,
      summary: `${results.filter((r) => r.success).length}/${bankNames.length} banco(s) aprovaram. ${totalAdjustments} ajuste(s) aplicado(s)`
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
          await this.saveInterProposal(proposal, bankResponse, clientId)
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
    bankResponse: BankProposalResponse,
    clientId?: bigint
  ): Promise<void> {
    const interRepo = RepositoryFactory.createInterProposalRepository()
    await interRepo.save(proposal, bankResponse, clientId)
  }

  private async saveSantanderProposal(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    clientId?: bigint
  ): Promise<void> {
    const sanatanderRepo = RepositoryFactory.createSantanderProposalRepository()
    const deParaRepo = RepositoryFactory.createDeParaRepository()
    const santanderdetails =
      await SantanderProposalDetailsMapper.mapFromSantanderResponse(
        bankResponse,
        proposal,
        clientId
      )
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

  private validateRequiredFields(proposal: CreditProposal): void {
    const requiredFields = [
      { field: proposal.maritalStatus, name: 'maritalStatus' },
      { field: proposal.propertyType, name: 'propertyType' },
      { field: proposal.gender, name: 'gender' },
      { field: proposal.workType, name: 'workType' },
      { field: proposal.amortization, name: 'amortization' },
      { field: proposal.financingRate, name: 'financingRate' }
      // { field: proposal.documentType, name: 'documentType' },
      // { field: proposal.documentIssuer, name: 'documentIssuer' }
    ]

    for (const { field, name } of requiredFields) {
      if (!field || field.trim() === '') {
        throw new Error(`Campo obrigatório '${name}' não pode estar vazio`)
      }
    }

    if (proposal.professionalPosition === undefined) {
      proposal.professionalPosition = ''
    }

    if (proposal.matrimonialRegime === undefined) {
      proposal.matrimonialRegime = ''
    }

    if (!proposal.documentIssueDate) {
      proposal.documentIssueDate = proposal.birthday
    }
  }
}
