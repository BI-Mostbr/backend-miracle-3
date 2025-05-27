// export class BradescoSimulationRepository
//   implements IBradescoSimulationRepository
// {
//   constructor(private prisma: PrismaClient) {}

//   async save(
//     simulation: CreditSimulation,
//     bankResponse: BankResponse,
//     userId?: string
//   ): Promise<BradescoSimulationData> {
//     try {
//       const bradescoData = await this.prisma.tb_simulacao_bradesco.create({
//         data: {
//           tipoSistemaAmortizador: 'SAC',
//           valorFinanciamento: simulation.loanAmount,
//           prazoFinanciamento: BigInt(simulation.installments),
//           valorTaxaJurosEfetivoAno: bankResponse.interestRate,
//           valorPrimeiraPrestacaoSemSeguroTac:
//             bankResponse.monthlyPayment * 0.95, // Sem seguro
//           valorPrimeiraPrestacaoComSeguroTac: bankResponse.monthlyPayment, // Com seguro
//           valorUltimaPrestacao:
//             bankResponse.metadata?.lastInstallment ||
//             bankResponse.monthlyPayment * 0.5,
//           valorRendaInformada: simulation.monthlyIncome,
//           valorRendaLiquidaMinimaExigida: bankResponse.monthlyPayment * 3,
//           valorCeshAno: 1.5,
//           valorCetAno:
//             bankResponse.metadata?.cet || bankResponse.interestRate + 0.5,
//           valorDevidoAtoContratacao: simulation.propertyValue * 0.02, // 2% do valor do imóvel
//           percentualDevidoAtoContratacao: 2.0,
//           valorLiberadoCliente: simulation.loanAmount * 0.98,
//           percentualValorLiberadoCliente: 98.0,
//           percentualTag: 0.5,
//           valorSeguro: bankResponse.monthlyPayment * 0.05,
//           valorTaxaAdministracaoMensal: 25.0,
//           indicadorFgts: false,
//           dataSimulacao: new Date().toISOString().split('T')[0],
//           descricaoGarantiaOperacao: 'ALIENACAO_FIDUCIARIA',
//           codigoCarteira: '001',
//           descricaoCarteira: 'HABITACIONAL_PF',
//           valorImovel: simulation.propertyValue,
//           valorTotalDespesasFinanceiras:
//             bankResponse.totalAmount - simulation.loanAmount,
//           valorTotalFinanciamento: bankResponse.totalAmount,
//           valorIof:
//             bankResponse.metadata?.iofTotal || simulation.loanAmount * 0.0038,
//           indexador: 'TR',
//           valorRdm: simulation.loanAmount * 0.001,
//           valorTaxaNominal: bankResponse.interestRate,
//           valorTag: simulation.loanAmount * 0.005,
//           cpf: simulation.customerCpf,
//           id_usuario: userId,
//           nome: simulation.customerName,
//           created_at: new Date()
//         }
//       })

//       console.log(`💾 Bradesco simulation saved with ID: ${bradescoData.id}`)
//       return bradescoData
//     } catch (error) {
//       console.error('❌ Error saving Bradesco simulation:', error)
//       throw new Error(`Failed to save Bradesco simulation: ${error.message}`)
//     }
//   }
// }
