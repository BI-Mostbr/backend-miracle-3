import { CreditProposal } from '@domain/entities'

export interface IClientData {
  id?: bigint
  created_at?: Date | null
  cpf: string
  id_santander?: bigint | null
  id_itau?: string | null
  id_bradesco?: bigint | null
  id_cef?: bigint | null
  id_inter?: string | null
  valor_solicitado?: number | null
  id_status?: number | null
  id_situacao?: number | null
  id_produto?: number | null
  data_finalizacao?: string | null
  id_incorporadora?: string | null
  id_banco_decisao?: string | null
  valor_reemissao?: number | null
  parceiro?: string | null
  dt_ult_atualizacao?: string | null
  id_consultor?: bigint | null
  situacao_itau_teste?: string | null
  id_bancofornecedor_decisao?: bigint | null
  data_banco_decisao?: string | null
  id_parceiro?: bigint | null
  id_cliente_incorporador?: bigint | null
}

export interface IClientDetailsData {
  id?: bigint
  created_at?: Date | null
  cpf_cnpj?: bigint | null
  nome?: string | null
  estado_civil?: string | null
  nacionalidade?: string | null
  tipo_imovel?: string | null
  sexo?: string | null
  tipo_contato?: string | null
  rg?: string | null
  tipo_endereco?: string | null
  tipo_renda?: string | null
  tipo_amortizacao?: string | null
  tipo_taxa_financiamento?: string | null
  UF_proponente?: string | null
  CEP?: string | null
  valor_entrada?: number | null
  prazo?: number | null
  municipio_imovel?: string | null
  FGTS?: boolean | null
  nr_pis?: string | null
  UF_imovel?: string | null
  tipo_carteira?: string | null
  seguradora?: string | null
  ITBI?: boolean | null
  percent_itbi?: string | null
  vlr_itbi?: number | null
  id_incorporadora?: bigint | null
  id_empreedimento?: bigint | null
  id_bloco?: bigint | null
  id_unidade?: bigint | null
  dt_nasc?: string | null
  nome_mae?: string | null
  orgao_expedidor?: string | null
  uf_rg?: string | null
  data_emissao_rg?: string | null
  nr_contato?: string | null
  email?: string | null
  endereco?: string | null
  numero_endereco?: string | null
  bairro_endereco?: string | null
  complemento_endereco?: string | null
  cidade_endereco?: string | null
  profissao?: string | null
  regime_trabalho?: string | null
  cnpj_empresa_cliente?: string | null
  nome_empresa?: string | null
  dados_bancarios?: string | null
  data_admissao?: string | null
  outras_rendas?: string | null
  vlr_renda_mensal?: number | null
  estado_civil_cliente?: string | null
  regime_casamento?: string | null
  segundo_proponente?: boolean | null
  uniao_estavel?: boolean | null
  id_segundo_proponente?: bigint | null
  id_terceiro_proponente?: bigint | null
  terceiro_proponente?: boolean | null
  cpf_cliente?: string | null
  id_consultor?: bigint | null
  id_lider?: number | null
  parceiro?: string | null
  valor_imovel?: number | null
  credito_aprovado?: number | null
  taxa_juros?: number | null
  vlr_solicitado?: number | null
  vlr_fgts?: number | null
  id_profissao?: bigint | null
  tipo_documento?: string | null
  cargo?: string | null
  tipo_residencia?: string | null
  agencia?: bigint | null
  conta?: bigint | null
  digitoConta?: bigint | null
  codigoCategoriaProfissao?: bigint | null
  percent_itbi_number?: number | null
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
