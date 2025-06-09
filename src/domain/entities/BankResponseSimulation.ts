export interface BankResponseSimulation {
  simulationId: string
  bankName: string
  financingValue: number
  installments: number
  firstInstallment: number
  lastInstallment: number
  interestRate: number
  cet: number
  propertyValue: number
  downPayment: number
  amortizationType: string
  ltv: number
  uuidUser?: string
  userId?: string

  bankSpecificData?: {
    santander?: {
      id_santander?: string
      prazo_anos?: number
      prazo_meses?: number
      valor_custas?: number
      valor_iof?: number
      taxa_juros_mensal?: number
      cesh?: number
    }

    bradesco?: {
      tipo_sistema_amortizador?: string
      valor_renda_informada?: number
      valor_renda_minima_exigida?: number
      valor_cesh_ano?: number
      valor_devido_ato_contratacao?: number
      valor_liberado_cliente?: number
      indicador_fgts?: boolean
      codigo_carteira?: string
      descricao_carteira?: string
      valor_iof?: number
      indexador?: string
    }
  }
}
