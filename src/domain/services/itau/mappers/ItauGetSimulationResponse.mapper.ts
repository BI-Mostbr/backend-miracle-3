import {
  GetItauSimulationResponse,
  GetItauSimulationWithInstallmentsResponse,
  ItauInstallment
} from '@infra/dtos/GetSimulation.dto'

export class ItauGetSimulationResponseMapper {
  static mapItauToFrontend(
    itauResponse: any,
    includeInstallments: boolean = false
  ): GetItauSimulationResponse | GetItauSimulationWithInstallmentsResponse {
    if (includeInstallments) {
      return this.mapItauToFrontendWithInstallments(itauResponse)
    } else {
      return this.mapItauToFrontendBasic(itauResponse)
    }
  }

  static mapItauToFrontendBasic(itauResponse: any): GetItauSimulationResponse {
    return {
      nome:
        itauResponse.customerName || itauResponse.nome || 'Nome não informado',
      status: this.statusSimulatedToFrontend(
        itauResponse.data.credit?.status || 25
      ),
      propertyValue: this.formatCurrency(itauResponse.data.propertyPrice || 0),
      totalCreditValue: this.formatCurrency(
        itauResponse.data.credit?.maxFinancingValue ||
          itauResponse.data.loanAmount ||
          0
      ),
      maxInstallmentAmount: this.formatCurrency(
        itauResponse.data.credit?.maxInstallmentValue ||
          itauResponse.data.firstInstallment?.totalValue ||
          0
      ),
      purchasingPower: this.formatCurrency(
        (itauResponse.data.credit?.maxInstallmentValue ||
          itauResponse.data.firstInstallment?.totalValue ||
          0) / 0.013431
      )
    }
  }

  static mapItauToFrontendWithInstallments(
    itauResponse: any
  ): GetItauSimulationWithInstallmentsResponse {
    const data = itauResponse.data

    return {
      simulationId: data.simulationId,
      amortizationType: data.amortizationType,
      financingType: data.financingType,
      insuranceType: data.insuranceType,
      feeType: data.feeType,
      loanAmount: data.loanAmount,
      period: data.period,
      downPayment: data.downPayment,

      firstInstallment: this.mapInstallment(data.firstInstallment),
      lastInstallment: this.mapInstallment(data.lastInstallment),

      cetAnnual: data.cetAnnual,
      cemAnnual: data.cemAnnual,
      ceshAnnual: data.ceshAnnual,
      installmentsTotalValue: data.installmentsTotalValue,
      annualRate: data.annualRate,
      monthlyRate: data.monthlyRate,

      productType: data.productType,
      propertyType: data.propertyType,
      propertyPrice: data.propertyPrice,
      includeRegistryCosts: data.includeRegistryCosts,
      includePropertyEvaluation: data.includePropertyEvaluation,
      includeIof: data.includeIof,

      proponents: data.proponents || [],

      installments: (data.installments || []).map((installment: any) =>
        this.mapInstallment(installment)
      )
    }
  }

  private static mapInstallment(installment: any): ItauInstallment {
    return {
      number: installment.number,
      remainingMonths: installment.remainingMonths,
      dueDate: installment.dueDate,
      beginningBalance: installment.beginningBalance,
      totalValue: installment.totalValue,
      amortization: installment.amortization,
      interest: installment.interest,
      endingBalance: installment.endingBalance,
      insurerDfi: installment.insurerDfi,
      insurerMip: installment.insurerMip,
      tac: installment.tac,
      iof: installment.iof
    }
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  static statusSimulatedToFrontend(value: number) {
    switch (value) {
      case 25:
        return 'Aprovado'
      default:
        return 'Reprovado'
    }
  }
}
