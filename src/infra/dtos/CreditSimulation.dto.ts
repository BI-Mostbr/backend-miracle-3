export interface CreditSimulationResponse {
  simulacao: {
    cpf: string
    nome: string
    ofertas: SimulationOffers[]
  }
}

export interface SimulationOffers {
  instituicao: string
  produto: string
  credito_solicitado: string
  prazo: string
  primeira_parcela: string
  ultima_parcela: string
  renda_minima: string
  taxa_juros: string
  cet: string
  valores: {
    financiavel: string
    amortizacao: string
    entrada: string
    ltv: string
    todas_parcelas: string
  }
  poder_de_compra: {
    descricao: string
  }
  tags: string[]
}
