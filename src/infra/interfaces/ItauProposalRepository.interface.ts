import { BankProposalResponse, CreditProposal } from '@domain/entities'

export interface IItauProposalData {
  id_most?: bigint
  created_at?: Date
  id_proposta: string
  decisao_credito?: string
  emissao_contrato?: string
  assinatura_contrato?: string
  vencimento_credito?: string
  liberacao_recurso?: string
  entrada_pasta?: string
  status_global?: string
  id_credito?: number
  descricao_credito?: string
  id_contratacao?: number
  descricao_contratacao?: string
  id_atividade?: number
  prazo_aprovado?: bigint
  taxa_juros_anual?: number
  valor_itbi?: number
  valor_avaliacao?: number
  credito_aprovado?: number
  agencia_numero?: string
  agencia_funcional_gerente?: string
  id_cliente_most?: bigint
  ltv?: string
  prazo?: bigint
  cet?: number
  valor_solicitado?: number
  id_status_most?: bigint
  id_situacao_most?: bigint
  id_substatus_most?: bigint
  status_laudo?: string
  data_abertura_laudo?: string
  data_encerramento_laudo?: string
  data_agendamento?: string
  data_implantacao_contrato?: string
  valor_fgts?: number
  valor_compra_venda?: number
  valor_tarifas?: number
  total_credito?: number
  id_incorporadora?: bigint
  id_empreendimento?: bigint
  id_bloco?: bigint
  id_unidade?: bigint
  id_anexo?: bigint
  unidade?: string
  anexo?: string
  bloco?: string
  proposal_uuid?: string
  total_documentps?: bigint
  proposta_copiada?: boolean
  id_cliente_incorporador?: bigint
  id_produto?: bigint
}

export interface IItauProposalRepository {
  save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    flowType: string
  ): Promise<IItauProposalData>
}
