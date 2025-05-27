import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import {
  IItauSimulationData,
  IItauSimulationRepository
} from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'

export class ItauSimulationRepository implements IItauSimulationRepository {
  constructor(private prisma: PrismaClient) {}
  async save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation
  ): Promise<IItauSimulationData> {
    const itauData = await this.prisma.simulacao.create({
      data: {
        produto: simulation.productType,
        tipo_imovel: simulation.propertyType,
        valor_imovel: simulation.propertyValue,
        valor_entrada: simulation.propertyValue - simulation.financingValue,
        prazo: simulation.installments,
        dt_nascimento_proponente: simulation.customerBirthDate,
        renda_proponente: 2000000,
        nr_doc_proponente: simulation.customerBirthDate,
        valor_emprestimo: simulation.financingValue,
        uuid_user: bankResponse.uuidUser,
        id_simulacao_itau: bankResponse.simulationId,
        id_usuario: simulation.userId,
        nome: simulation.customerName,
        taxa_juros: bankResponse.interestRate,
        cet_anual: bankResponse.cet,
        created_at: new Date()
      }
    })
    return itauData
  }
  catch(error: unknown) {
    console.error('error saving itau simulation', error)
    throw new Error(
      `Failed to save Itau simulation: ${(error as Error).message}`
    )
  }
}
