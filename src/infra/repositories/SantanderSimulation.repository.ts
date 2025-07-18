import { BankResponseSimulation, CreditSimulation } from '@domain/entities'
import {
  ISantanderSimulationData,
  ISantanderSimulationRepository
} from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'

export class SantanderSimulationRepository
  implements ISantanderSimulationRepository
{
  constructor(private prisma: PrismaClient) {}

  async save(
    simulation: CreditSimulation,
    bankResponse: BankResponseSimulation
  ): Promise<ISantanderSimulationData> {
    try {
      const santanderSpecificData = bankResponse.bankSpecificData?.santander
      const santanderData = await this.prisma.simulacao_santander.create({
        data: {
          id_santander: bankResponse.simulationId,
          id_santander_decript: santanderSpecificData?.id_santander_decript,
          produto: santanderSpecificData?.produto,
          valor_imovel: simulation.propertyValue,
          fgts: 0,
          valor_solicitado: simulation.financingValue,
          prazo_anos: santanderSpecificData?.prazo_anos,
          prazo_meses: bankResponse.installments,
          valor_minimo_solicitado:
            santanderSpecificData?.valor_minimo_solicitado,
          valor_maximo_solicitado:
            santanderSpecificData?.valor_maximo_solicitado,
          valor_entrada: bankResponse.downPayment,
          valor_custas: 0, // Será calculado se necessário
          valor_iof: santanderSpecificData?.valor_iof || 0,
          valor_financiamento_custas:
            santanderSpecificData?.valor_financiamento_custas,
          index_tr: santanderSpecificData?.index_tr,
          tipo_carteira: santanderSpecificData?.tipo_carteira,
          campanha: santanderSpecificData?.campanha,
          key_campanha: santanderSpecificData?.key_campanha,
          segmento: santanderSpecificData?.segmento,
          key_segmento: santanderSpecificData?.key_segmento,
          relacionamento_banco: santanderSpecificData?.relacionamento_banco,
          key_relacionamento_banco:
            santanderSpecificData?.key_relacionamento_banco,
          seguro: santanderSpecificData?.seguro,
          key_seguro: santanderSpecificData?.key_seguro,
          amortizacao: santanderSpecificData?.amortizacao,
          key_amortizacao: santanderSpecificData?.key_amortizacao,
          tipo_pagamento: santanderSpecificData?.tipo_pagamento,
          key_tipo_pagamento: santanderSpecificData?.key_tipo_pagamento,
          tipo_simulacao: santanderSpecificData?.tipo_simulacao,
          taxa_juros_anual: bankResponse.interestRate,
          taxa_juros_mensal: santanderSpecificData?.taxa_juros_mensal,
          primeira_parcela: santanderSpecificData?.primeira_parcela,
          ultima_parcela: santanderSpecificData?.ultima_parcela,
          cet: bankResponse.cet,
          cesh: santanderSpecificData?.cesh, // Valor padrão
          nome: simulation.customerName,
          tipo_imovel: simulation.propertyType,
          cpf: simulation.customerCpf,
          celular: santanderSpecificData?.celular,
          renda: santanderSpecificData?.renda,
          dt_nascimento: santanderSpecificData?.dt_nascimento,
          id_usuario: santanderSpecificData?.id_usuario,
          created_at: new Date()
        }
      })

      console.log(`💾 Santander simulation saved with ID: ${santanderData.id}`)
      return santanderData
    } catch (error) {
      throw new Error('Failed to save Santander simulation')
    }
  }
}
