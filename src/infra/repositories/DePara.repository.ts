import {
  IDeParaRepository,
  StatusDeParaResult,
  StatusNameResult
} from '@infra/interfaces/DeParaRepository.interface'
import { PrismaClient } from '@prisma/client'

export class DeParaRepository implements IDeParaRepository {
  constructor(private prisma: PrismaClient) {}

  // Método existente
  async findStatusByGlobalStatus(
    statusGlobal: string,
    idBanco: number
  ): Promise<StatusDeParaResult> {
    try {
      const result = await this.prisma.tb_depara.findFirst({
        where: {
          status: statusGlobal,
          id_banco: idBanco
        },
        select: {
          id_status_most: true,
          id_situacao_most: true
        }
      })

      if (!result) {
        throw new Error(`Status global ${statusGlobal} não encontrado`)
      }

      return {
        id_status_most: result.id_status_most,
        id_situacao_most: result.id_situacao_most
      }
    } catch (error) {
      console.error('Erro no repositório DeParaSantander:', error)
      throw new Error(`Falha ao buscar status: ${(error as Error).message}`)
    }
  }

  // 🔥 NOVO MÉTODO: Buscar nome do status para exibir na resposta
  async getStatusNameByIds(
    idStatusMost: bigint | null,
    idSituacaoMost: bigint | null
  ): Promise<StatusNameResult> {
    try {
      console.log(
        `🔍 Buscando nome do status - id_status_most: ${idStatusMost}, id_situacao_most: ${idSituacaoMost}`
      )

      // Buscar nome do status
      let nomeStatus = 'Status Desconhecido'
      if (idStatusMost) {
        const statusResult = await this.prisma.tb_status.findUnique({
          where: { id: idStatusMost },
          select: { nome_status: true }
        })
        if (statusResult?.nome_status) {
          nomeStatus = statusResult.nome_status
        }
      }

      // Buscar nome da situação
      let situacao = 'Situação Desconhecida'
      if (idSituacaoMost) {
        const situacaoResult = await this.prisma.tb_situacao.findUnique({
          where: { id: idSituacaoMost },
          select: { situacao: true }
        })
        if (situacaoResult?.situacao) {
          situacao = situacaoResult.situacao
        }
      }

      console.log(
        `✅ Status encontrado: "${nomeStatus}" | Situação: "${situacao}"`
      )

      return {
        nome_status: nomeStatus,
        situacao: situacao
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do status:', error)
      return {
        nome_status: 'Erro ao buscar status',
        situacao: 'Erro ao buscar situação'
      }
    }
  }

  // 🔥 NOVO MÉTODO: Buscar situação da proposta por CPF e banco
  async getProposalStatusByCpfAndBank(
    cpf: string,
    bankName: string
  ): Promise<StatusNameResult> {
    try {
      console.log(
        `🔍 Buscando situação da proposta - CPF: ${cpf}, Banco: ${bankName}`
      )

      let proposalStatus: {
        id_status_most: bigint | null
        id_situacao_most: bigint | null
      } | null = null

      // Buscar na tabela específica do banco
      switch (bankName.toLowerCase()) {
        case 'itau':
          // Buscar cliente na tb_clientes para pegar o id
          const clienteItau = await this.prisma.tb_clientes.findUnique({
            where: { cpf: cpf },
            select: { id: true }
          })

          if (clienteItau) {
            const itauProposal = await this.prisma.tb_itau.findFirst({
              where: { id_cliente_most: clienteItau.id },
              select: {
                id_status_most: true,
                id_situacao_most: true
              },
              orderBy: { created_at: 'desc' } // Pegar a mais recente
            })
            proposalStatus = itauProposal
          }
          break

        case 'inter':
          const interProposal = await this.prisma.tb_inter.findFirst({
            where: { cpf: cpf },
            select: {
              id_status_most: true,
              id_situacao_most: true
            },
            orderBy: { created_at: 'desc' } // Pegar a mais recente
          })
          proposalStatus = interProposal
          break

        case 'santander':
          const clienteSantander = await this.prisma.tb_clientes.findUnique({
            where: { cpf: cpf },
            select: { id: true }
          })

          if (clienteSantander) {
            const santanderProposal = await this.prisma.tb_santander.findFirst({
              where: { id_cliente_most: clienteSantander.id },
              select: {
                id_status_most: true,
                id_situacao_most: true
              },
              orderBy: { created_at: 'desc' } // Pegar a mais recente
            })
            proposalStatus = santanderProposal
          }
          break

        default:
          console.warn(`⚠️ Banco não implementado: ${bankName}`)
          return {
            nome_status: 'Aguardando Processamento',
            situacao: 'Enviado'
          }
      }

      // Se encontrou status na tabela do banco, buscar o nome da situação
      if (proposalStatus) {
        return await this.getStatusNameByIds(
          proposalStatus.id_status_most,
          proposalStatus.id_situacao_most
        )
      }

      // Status padrão se não encontrou
      console.log(
        `⚠️ Nenhuma proposta encontrada para CPF ${cpf} no banco ${bankName}`
      )
      return {
        nome_status: 'Aguardando Processamento',
        situacao: 'Enviado' // Situação padrão
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status da proposta:', error)
      return {
        nome_status: 'Erro no Processamento',
        situacao: 'Erro' // Situação de erro
      }
    }
  }

  // 🔥 MÉTODO UTILITÁRIO: Mapear ID do banco
  private getBankId(bankName: string): number {
    const bankIdMap: { [key: string]: number } = {
      itau: 1,
      inter: 2,
      santander: 3,
      bradesco: 4,
      bb: 5,
      caixa: 6
    }
    return bankIdMap[bankName.toLowerCase()] || 1
  }
}
