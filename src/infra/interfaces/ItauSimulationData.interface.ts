export interface IItauSimulationData {
  id?: bigint
  created_at?: Date
  produto?: string
  tipo_imovel?: string
  valor_imovel?: number
  valor_entrada?: number
  prazo?: number
  dt_nascimento_proponente?: string
  renda_proponente?: number
  nr_doc_proponente?: string
  valor_emprestimo?: number | null
  uuid_user: string
  id_simulacao_itau?: string | null
  id_usuario?: string | null
  nome?: string | null
  taxa_juros?: number | null
  cet_anual?: number | null
}
