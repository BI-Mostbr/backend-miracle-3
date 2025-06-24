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
}
