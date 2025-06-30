import { CreditProposal } from '@domain/entities'

export interface IClientData {
  id?: bigint
  created_at?: Date
  cpf: string
  id_santander?: bigint
  id_itau?: string
  id_bradesco?: bigint
  id_cef?: bigint
  id_inter?: string
  valor_solicitado?: number
  id_status?: number
  id_situacao?: number
  id_produto?: number
  data_finalizacao?: string
  id_incorporadora?: string
  id_banco_decisao?: string
  valor_reemissao?: number
  parceiro?: string
  dt_ult_atualizacao?: string
  id_consultor?: bigint
  situacao_itau_teste?: string
  id_bancofornecedor_decisao?: bigint
  data_banco_decisao?: string
  id_parceiro?: bigint
  id_cliente_incorporador?: bigint
}

export interface IClientDetailsData {
  id?: bigint
  created_at?: Date
  cpf_cnpj?: bigint
  nome?: string
  estado_civil?: string
  nacionalidade?: string
  tipo_imovel?: string
  sexo?: string
  tipo_contato?: string
  rg?: string
  tipo_endereco?: string
  tipo_renda?: string
  tipo_amortizacao?: string
  tipo_taxa_financiamento?: string
  UF_proponente?: string
  CEP?: string
  valor_entrada?: number
  prazo?: number
  municipio_imovel?: string
  FGTS?: boolean
  nr_pis?: string
  UF_imovel?: string
  tipo_carteira?: string
  seguradora?: string
  ITBI?: boolean
  percent_itbi?: string
  vlr_itbi?: number
  id_incorporadora?: bigint
  id_empreedimento?: bigint
  id_bloco?: bigint
  id_unidade?: bigint
  dt_nasc?: string
  nome_mae?: string
  orgao_expedidor?: string
  uf_rg?: string
  data_emissao_rg?: string
  nr_contato?: string
  email?: string
  endereco?: string
  numero_endereco?: string
  bairro_endereco?: string
  complemento_endereco?: string
  cidade_endereco?: string
  profissao?: string
  regime_trabalho?: string
  cnpj_empresa_cliente?: string
  nome_empresa?: string
  dados_bancarios?: string
  data_admissao?: string
  outras_rendas?: string
  vlr_renda_mensal?: number
  estado_civil_cliente?: string
  regime_casamento?: string
  segundo_proponente?: boolean
  uniao_estavel?: boolean
  id_segundo_proponente?: bigint
  id_terceiro_proponente?: bigint
  terceiro_proponente?: boolean
  cpf_cliente?: string
  id_consultor?: bigint
  id_lider?: number
  parceiro?: string
  valor_imovel?: number
  credito_aprovado?: number
  taxa_juros?: number
  vlr_solicitado?: number
  vlr_fgts?: number
  id_profissao?: bigint
  tipo_documento?: string
  cargo?: string
  tipo_residencia?: string
  agencia?: bigint
  conta?: bigint
  digitoConta?: bigint
  codigoCategoriaProfissao?: bigint
  percent_itbi_number?: number
}

export interface IClientRepository {
  save(proposal: CreditProposal): Promise<IClientData>
  saveDetails(
    proposal: CreditProposal,
    clientId: bigint
  ): Promise<IClientDetailsData>
  findByCpf(cpf: string): Promise<IClientData | null>
  updateBankProposal(
    cpf: string,
    bankName: string,
    proposalId: string
  ): Promise<void>
}
