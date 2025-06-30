import { BankProposalResponse, CreditProposal } from '@domain/entities'

export interface IInterProposalData {
  id?: bigint
  created_at?: Date
  cpf?: string
  id_cliente_most?: bigint
  id_proposta?: string
  id_simulacao?: string
  taxaIof?: number
  taxa?: string
  taxaJuros?: string
  cet?: number
  cesh?: number
  valorFinanciamento?: number
  valorEntrada?: number
  valorImovel?: number
  valorLiberado?: number
  tarifaAvaliacao?: number
  valorPrimeiraParcela?: number
  valorUltimaParcela?: number
  totalDevido?: number
  prazoEmprestimo?: bigint
  produtoAprovado?: string
  tipoProduto?: string
  etapaAtual?: string
  etapaTarefaPreAnalise?: string
  etapaTarefaAnaliseCredito?: string
  statusAnaliseCredito?: string
  modeloOperacional?: string
  sistemaAmortizacao?: string
  indexador?: string
  despesas?: number
  dataProposta?: string
  rendaSugerida?: number
  estadoImovel?: string
  tipoImovel?: string
  id_status_most?: bigint
  id_situacao_most?: bigint
  id_substatus_most?: bigint
  situacao?: string
  ltv?: number
  taxa_de_juros_float?: number
  ltv_text?: string
  numero_proposta?: string
  id_cliente_incorporador?: bigint
  id_produto?: bigint
}

export interface IInterProposalRepository {
  save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    flowType: string
  ): Promise<IInterProposalData>
}
