// import { BankResponseSimulation, CreditSimulation } from "@domain/entities";
// import { ISantanderSimulationData } from "@infra/interfaces";
// import { PrismaClient } from "@prisma/client";

// export class SantanderSimulationRepository implements ISantanderSimulationRepository {
//     constructor(private prisma: PrismaClient) {}

//     async save(
//       simulation: CreditSimulation,
//       bankResponse: BankResponseSimulation,
//       userId?: string
//     ): Promise<ISantanderSimulationData> {
//       try {
//         const santanderData = await this.prisma.simulacao_santander.create({
//           data: {
//             id_santander: bankResponse.simulationId,
//             id_santander_decript: bankResponse.simulationId,
//             produto: simulation.productType,
//             valor_imovel: simulation.propertyValue,
//             fgts: 0,
//             valor_solicitado: simulation.financingValue,
//             prazo_anos: BigInt(Math.floor(simulation.installments / 12)),
//             prazo_meses: BigInt(simulation.installments),
//             valor_minimo_solicitado: simulation.loanAmount,
//             valor_maximo_solicitado: simulation.loanAmount,
//             valor_entrada: simulation.propertyValue - simulation.loanAmount,
//             valor_custas: 0, // Será calculado se necessário
//             valor_iof: bankResponse.metadata?.iofTotal || 0,
//             valor_financiamento_custas: simulation.loanAmount,
//             index_tr: "TR",
//             tipo_carteira: "PESSOA_FISICA",
//             campanha: "PADRAO",
//             key_campanha: "001",
//             segmento: "VAREJO",
//             key_segmento: "001",
//             relacionamento_banco: "NOVO_CLIENTE",
//             key_relacionamento_banco: "001",
//             seguro: "SANTANDER",
//             key_seguro: "001",
//             amortizacao: "SAC",
//             key_amortizacao: "001",
//             tipo_pagamento: "DEBITO_AUTOMATICO",
//             key_tipo_pagamento: "001",
//             tipo_simulacao: "ONLINE",
//             taxa_juros_anual: bankResponse.interestRate,
//             taxa_juros_mensal: bankResponse.interestRate / 12,
//             primeira_parcela: bankResponse.monthlyPayment,
//             ultima_parcela: bankResponse.metadata?.lastInstallment || (bankResponse.monthlyPayment * 0.5),
//             cet: bankResponse.metadata?.cet || (bankResponse.interestRate + 0.5),
//             cesh: 1.5, // Valor padrão
//             nome: simulation.customerName,
//             tipo_imovel: "RESIDENCIAL",
//             cpf: simulation.customerCpf,
//             celular: simulation.customerPhone || "",
//             renda: simulation.monthlyIncome,
//             dt_nascimento: this.extractBirthDateFromCpf(simulation.customerCpf),
//             id_usuario: userId,
//             created_at: new Date()
//           }
//         });

//         console.log(`💾 Santander simulation saved with ID: ${santanderData.id}`);
//         return santanderData;
//       } catch (error) {
//         console.error('❌ Error saving Santander simulation:', error);
//         throw new Error(`Failed to save Santander simulation: ${error.message}`);
//       }
//     }
// }
