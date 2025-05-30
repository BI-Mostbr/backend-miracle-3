import { SimulateCreditUseCase } from '@application/use-cases/SimulateCreditUseCases'
import { CreditSimulationResponseMapper } from '@infra/mappers/CreditSimulation.mapper'
import { Request, Response } from 'express'

export class CreditSimulationController {
  constructor(private useCase: SimulateCreditUseCase) {}

  /**
   * @openapi
   * /api/credit/simulation/all:
   *   post:
   *     summary: Simular crédito em todos os bancos
   *     description: Realiza simulação em múltiplos bancos e retorna no formato esperado pelo frontend
   *     tags:
   *       - Credit Simulation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customerCpf
   *               - customerName
   *               - propertyValue
   *               - loanAmount
   *               - installments
   *               - monthlyIncome
   *             properties:
   *               customerCpf:
   *                 type: string
   *                 example: "98906637080"
   *               customerName:
   *                 type: string
   *                 example: "Teste Simulador"
   *               customerEmail:
   *                 type: string
   *                 example: "teste@email.com"
   *               propertyValue:
   *                 type: number
   *                 example: 200000
   *               loanAmount:
   *                 type: number
   *                 example: 100000
   *               installments:
   *                 type: number
   *                 example: 100
   *               monthlyIncome:
   *                 type: number
   *                 example: 8000
   *     responses:
   *       200:
   *         description: Simulação realizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 simulacao:
   *                   type: object
   *                   properties:
   *                     cpf:
   *                       type: string
   *                       example: "98906637080"
   *                     nome:
   *                       type: string
   *                       example: "Teste Simulador"
   *                     ofertas:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           instituicao:
   *                             type: string
   *                             example: "Itaú"
   *                           credito_solicitado:
   *                             type: string
   *                             example: "R$ 100.000,00"
   *                           prazo:
   *                             type: string
   *                             example: "100 meses"
   *                           primeira_parcela:
   *                             type: string
   *                             example: "R$2.096,33"
   *                           taxa_juros:
   *                             type: string
   *                             example: "13.69% a.a."
   *       400:
   *         description: Dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  async simulateWithBank(req: Request, res: Response): Promise<void> {
    try {
      const bankName = req.params.bankName?.toLowerCase()
      const simulationData = req.body
      const simulation = {
        customerBirthDate: simulationData.customerBirthDate,
        customerName: simulationData.customerName,
        customerCpf: simulationData.customerCpf,
        propertyValue: simulationData.propertyValue,
        financingValue: simulationData.financingValue,
        installments: simulationData.installments,
        productType: simulationData.productType,
        propertyType: simulationData.propertyType,
        financingRate: simulationData.financingRate,
        amortizationType: simulationData.amortizationType,
        userId: simulationData.userId
      }

      const bankResponse = await this.useCase.simulateWithBank(
        simulation,
        bankName
      )
      const frontendResponse =
        CreditSimulationResponseMapper.convertToFrontendResponse(simulation, [
          bankResponse
        ])
      res.json(frontendResponse)
    } catch (error) {
      console.error('Error in credit simulation:', error)

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }
}
