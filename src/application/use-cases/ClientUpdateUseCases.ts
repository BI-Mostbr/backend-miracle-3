import { ClientRepository } from '@infra/repositories/Client.repository'
import {
  UpdateDecisionBankRequest,
  RemoveDecisionBankRequest,
  UpdateResponsibleUserRequest,
  UpdatePartnerRequest,
  UpdateClientNameRequest,
  ClientUpdateResponse
} from '@infra/dtos/ClientUpdate.dto'
import { cleanCpf } from 'Utils/removeMasks'

export class ClientUpdateUseCases {
  constructor(private clientRepository: ClientRepository) {}

  async updateDecisionBank(
    request: UpdateDecisionBankRequest
  ): Promise<ClientUpdateResponse> {
    try {
      const cleanedCpf = cleanCpf(request.cpf)

      const existingClient = await this.clientRepository.findByCpf(cleanedCpf)
      if (!existingClient) {
        return {
          success: false,
          message: `Cliente com CPF ${request.cpf} não encontrado`
        }
      }

      await this.clientRepository.updateDecisionBank(
        cleanedCpf,
        request.idProposta,
        request.idBanco
      )

      return {
        success: true,
        message: 'Banco de decisão atualizado com sucesso',
        cpf: request.cpf,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar banco de decisão:', error)
      return {
        success: false,
        message: `Erro ao atualizar banco de decisão: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    }
  }

  async removeDecisionBank(
    request: RemoveDecisionBankRequest
  ): Promise<ClientUpdateResponse> {
    try {
      const cleanedCpf = cleanCpf(request.cpf)

      const existingClient = await this.clientRepository.findByCpf(cleanedCpf)
      if (!existingClient) {
        return {
          success: false,
          message: `Cliente com CPF ${request.cpf} não encontrado`
        }
      }

      await this.clientRepository.removeDecisionBank(cleanedCpf)

      return {
        success: true,
        message: 'Decisão do banco removida com sucesso',
        cpf: request.cpf,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao remover decisão do banco:', error)
      return {
        success: false,
        message: `Erro ao remover decisão do banco: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    }
  }

  async updateResponsibleUser(
    request: UpdateResponsibleUserRequest
  ): Promise<ClientUpdateResponse> {
    try {
      const cleanedCpf = cleanCpf(request.cpf)
      const existingClient = await this.clientRepository.findByCpf(cleanedCpf)
      if (!existingClient) {
        return {
          success: false,
          message: `Cliente com CPF ${request.cpf} não encontrado`
        }
      }

      await this.clientRepository.updateResponsibleUser(
        cleanedCpf,
        request.idConsultor
      )

      return {
        success: true,
        message: 'Consultor responsável atualizado com sucesso',
        cpf: request.cpf,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar consultor responsável:', error)
      return {
        success: false,
        message: `Erro ao atualizar consultor responsável: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    }
  }

  async updatePartner(
    request: UpdatePartnerRequest
  ): Promise<ClientUpdateResponse> {
    try {
      const cleanedCpf = cleanCpf(request.cpf)

      // Validar se o cliente existe
      const existingClient = await this.clientRepository.findByCpf(cleanedCpf)
      if (!existingClient) {
        return {
          success: false,
          message: `Cliente com CPF ${request.cpf} não encontrado`
        }
      }

      await this.clientRepository.updatePartner(cleanedCpf, request.idPartner)

      return {
        success: true,
        message: 'Parceiro atualizado com sucesso',
        cpf: request.cpf,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error)
      return {
        success: false,
        message: `Erro ao atualizar parceiro: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    }
  }

  async updateClientName(
    request: UpdateClientNameRequest
  ): Promise<ClientUpdateResponse> {
    try {
      const cleanedCpf = cleanCpf(request.cpf)

      const existingClient = await this.clientRepository.findByCpf(cleanedCpf)
      if (!existingClient) {
        return {
          success: false,
          message: `Cliente com CPF ${request.cpf} não encontrado`
        }
      }

      await this.clientRepository.updateClientName(
        cleanedCpf,
        request.clientName.trim()
      )

      return {
        success: true,
        message: 'Nome do cliente atualizado com sucesso',
        cpf: request.cpf,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar nome do cliente:', error)
      return {
        success: false,
        message: `Erro ao atualizar nome do cliente: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      }
    }
  }
}
