import { BankResponseSimulation, CreditSimulation } from '@domain/entities'

export class CreditSimulationResponseMapper {
  static convertToFrontendResponse(
    simulation: CreditSimulation,
    bankResponses: BankResponseSimulation[]
  ) {
    return {
      simulacao: {
        cpf: simulation.customerCpf,
        nome: simulation.customerName,
        ofertas: bankResponses.map((response) =>
          this.convertOfferToFrontendResponse(simulation, response)
        )
      }
    }
  }

  private static convertOfferToFrontendResponse(
    simulation: CreditSimulation,
    bankResponses: BankResponseSimulation
  ) {
    const downPayment = simulation.propertyValue - simulation.financingValue
    const ltv = (
      (simulation.financingValue / simulation.propertyValue) *
      100
    ).toFixed(0)
    const minimumIncome = this.calculateMinimumIncome(
      bankResponses.firstInstallment
    )
    return {
      idSimulacao: bankResponses.simulationId,
      instituicao: bankResponses.bankName,
      credito_solicitado: this.formatCurrency(simulation.financingValue),
      prazo: `${simulation.installments} meses`,
      primeira_parcela: this.formatCurrency(bankResponses.firstInstallment),
      ultima_parcela: this.formatCurrency(bankResponses.lastInstallment),
      renda_minima: this.formatCurrency(minimumIncome),
      taxa_juros: this.formatInterestRate(
        bankResponses.interestRate,
        bankResponses.bankName
      ),
      cet: bankResponses.cet,
      repasse: {
        financiavel: this.formatCurrency(simulation.financingValue),
        amortizacao: bankResponses.amortizationType,
        entrada: this.formatCurrency(downPayment),
        ltv: `${ltv}%`,
        todas_parcelas: 'Baixar simulação'
      },
      poder_de_compra: {
        descricao: 'Descubra o potencial máximo de financiamento do seu cliente'
      },
      tags: ['NOVIDADE']
    }
  }

  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  private static formatInterestRate(rate: number, bankName: string): string {
    const normalizedRate = rate < 1 ? rate * 100 : rate

    switch (bankName.toLowerCase()) {
      case 'inter':
        return `${normalizedRate.toFixed(2)}% + IPCA a.a`
      default:
        return `${normalizedRate.toFixed(2)}% a.a`
    }
  }

  private static calculateMinimumIncome(firstInstallment: number): number {
    return firstInstallment * 3
  }
}
