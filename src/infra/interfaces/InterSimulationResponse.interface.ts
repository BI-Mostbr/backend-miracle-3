export interface IInterSimulationResponse {
  id?: bigint
  created_at?: Date
  data_nasc?: string | null
  tipoProduto?: string | null
  valorEntrada?: number | null
  quantidadeParcelas?: bigint | null
  valorSolicitado?: number | null
  valorImovel?: number | null
  categoriaImovel?: string | null
  estadoImovel?: string | null
  produtoCompleto?: string | null
  taxaRegex?: number | null
  valorPrimeiraParcela?: number | null
  valorUltimaParcela?: number | null
  valorTotal?: number | null
  totalCet?: number | null
  totalCesh?: number | null
  sistemaAmortizacao?: string | null
  despesas?: number | null
  despesasRegistro?: number | null
  percentualIof?: number | null
  percentualCet?: number | null
  percentualCesh?: number | null
  urlEvolucaoTeorica?: string | null
  rendaSugerida?: number | null
  cpf?: string | null
  id_usuario?: bigint | null
}
