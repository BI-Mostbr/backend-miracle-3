import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { ProposalDomainService } from '@domain/validation/services/ProposalDomain.service'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { IBankProposalApiService } from '@infra/interfaces'
import { IProposalClientRepository } from '@infra/interfaces/ProposalClientRepository.interface'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'
import { ItauApiService } from '@domain/services/itau/ItauApiService'
import { ItauProposalDetailsMapper } from '@domain/services/itau/mappers/ItauProposalDetails.mapper'
import { ItauProposalDetails } from '@infra/interfaces/ItauProposalDetails.interface'

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
    private proposalClientRepository: IProposalClientRepository
  ) {}

  async sendToSpecificBank(
    proposal: CreditProposal,
    bankName: string
  ): Promise<SendProposalResult> {
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    if (!ProposalDomainService.validateForBank(proposal, bankName)) {
      throw new Error(
        `Proposta não atende às regras específicas do ${bankName}`
      )
    }

    const bankService = this.findBankService(bankName)
    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
      const bankResponse = await bankService.sendProposal(proposal)

      clientId = await this.executeFlowLogic(proposal)

      await this.saveBankProposal(proposal, bankResponse, bankName, clientId)

      if (proposal.fluxo === 'normal' || proposal.fluxo === 'adicionar-banco') {
        const bankProposalIdentifier =
          bankResponse.proposalNumber || bankResponse.proposalId
        await this.proposalClientRepository.updateBankProposal(
          CreditProposalMapper.getCleanCpf(proposal),
          bankName,
          bankProposalIdentifier
        )
      }

      results.push({
        bankName,
        success: true,
        proposalId: bankResponse.proposalId,
        proposalNumber: bankResponse.proposalNumber
      })
    } catch (error) {
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
    if (!ProposalDomainService.validateBusinessRules(proposal)) {
      throw new Error('Proposta não atende às regras de negócio')
    }

    const results: ProposalResult[] = []
    let clientId: bigint | undefined

    try {
      for (const bankName of bankNames) {
        try {
          if (!ProposalDomainService.validateForBank(proposal, bankName)) {
            throw new Error(
              `Proposta não atende às regras específicas do ${bankName}`
            )
          }

          const bankService = this.findBankService(bankName)
          const bankResponse = await bankService.sendProposal(proposal)

          if (!clientId) {
            clientId = await this.executeFlowLogic(proposal)
          }
          await this.saveBankProposal(
            proposal,
            bankResponse,
            bankName,
            clientId
          )

          if (proposal.fluxo === 'adicionar-banco') {
            await this.proposalClientRepository.updateBankProposal(
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
        } catch (error) {
          results.push({
            bankName,
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }
    } catch (error) {
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
          console.log(`⚠️ Santander repository não implementado ainda`)
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
