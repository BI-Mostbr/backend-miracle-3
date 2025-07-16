import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import { IInterSimulationRepository } from '@infra/interfaces/InterSimulation.repository.interface'
import { IInterSimulationResponse } from '@infra/interfaces/InterSimulationResponse.interface'
import { PrismaClient } from '@prisma/client'

export class InterSimulationRepository implements IInterSimulationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation
  ): Promise<IInterSimulationResponse> {
    try {
      const interSpecificData = bankResponse.bankSpecificData?.inter

      const interData = await this.prisma.tb_simulacao_inter.create({
        data: {
          data_nasc: simulation.customerBirthDate,
          tipoProduto: simulation.productType,
          valorEntrada: simulation.propertyValue - simulation.financingValue,
          quantidadeParcelas: simulation.installments
            ? BigInt(simulation.installments)
            : BigInt(0),
          valorSolicitado: simulation.financingValue,
          valorImovel: simulation.propertyValue,
          categoriaImovel: simulation.propertyType,
          estadoImovel: 'SP',
          produtoCompleto: interSpecificData?.produto || bankResponse.bankName,
          taxaRegex: bankResponse.interestRate,
          valorPrimeiraParcela: bankResponse.firstInstallment,
          valorUltimaParcela: bankResponse.lastInstallment,
          valorTotal: interSpecificData?.valorTotal || 0,
          totalCet: interSpecificData?.totalCet || 0,
          totalCesh: interSpecificData?.totalCesh || 0,
          sistemaAmortizacao: bankResponse.amortizationType,
          despesas: interSpecificData?.despesas || 0,
          despesasRegistro: interSpecificData?.despesasRegistro || 0,
          percentualIof: interSpecificData?.percentualIof || 0,
          percentualCet: bankResponse.cet * 100,
          percentualCesh: interSpecificData?.percentualCesh || 0,
          urlEvolucaoTeorica: interSpecificData?.urlEvolucaoTeorica || '',
          rendaSugerida: interSpecificData?.rendaSugerida || 0,
          cpf: simulation.customerCpf,
          id_usuario: simulation.userId ? BigInt(simulation.userId) : undefined,
          created_at: new Date()
        }
      })

      return interData
    } catch (error) {
      console.error('Error saving Inter simulation:', error)
      throw new Error(
        `Failed to save Inter simulation: ${(error as Error).message}`
      )
    }
  }

  async findByCpf(cpf: string): Promise<IInterSimulationResponse | null> {
    try {
      const interData = await this.prisma.tb_simulacao_inter.findFirst({
        where: { cpf: cpf },
        orderBy: { created_at: 'desc' }
      })

      if (!interData) {
        console.log(
          `Nenhuma simulação encontrada na tb_simulacao_inter para CPF: ${cpf}`
        )
        return null
      }

      return {
        id: interData.id,
        created_at: interData.created_at,
        data_nasc: interData.data_nasc,
        tipoProduto: interData.tipoProduto,
        valorEntrada: interData.valorEntrada,
        quantidadeParcelas: interData.quantidadeParcelas,
        valorSolicitado: interData.valorSolicitado,
        valorImovel: interData.valorImovel,
        categoriaImovel: interData.categoriaImovel,
        estadoImovel: interData.estadoImovel,
        produtoCompleto: interData.produtoCompleto,
        taxaRegex: interData.taxaRegex,
        valorPrimeiraParcela: interData.valorPrimeiraParcela,
        valorUltimaParcela: interData.valorUltimaParcela,
        valorTotal: interData.valorTotal,
        totalCet: interData.totalCet,
        totalCesh: interData.totalCesh,
        sistemaAmortizacao: interData.sistemaAmortizacao,
        despesas: interData.despesas,
        despesasRegistro: interData.despesasRegistro,
        percentualIof: interData.percentualIof,
        percentualCet: interData.percentualCet,
        percentualCesh: interData.percentualCesh,
        urlEvolucaoTeorica: interData.urlEvolucaoTeorica,
        rendaSugerida: interData.rendaSugerida,
        cpf: interData.cpf,
        id_usuario: interData.id_usuario
      }
    } catch (error) {
      console.error('Erro ao buscar dados na tb_simulacao_inter:', error)
      throw new Error(
        `Erro ao buscar simulação do Inter para CPF ${cpf}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }
}
