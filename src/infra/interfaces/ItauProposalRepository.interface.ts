import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { ItauProposalDetails } from './ItauProposalDetails.interface'

export interface IItauProposalData {
  id_most?: bigint
  created_at?: Date
  id_proposta: string
  decisao_credito?: string | null
  emissao_contrato?: string | null
  assinatura_contrato?: string | null
  vencimento_credito?: string | null
  liberacao_recurso?: string | null
  entrada_pasta?: string | null
  status_global?: string | null
  id_credito?: number | null
  descricao_credito?: string | null
  id_contratacao?: number | null
  descricao_contratacao?: string | null
  id_atividade?: number | null
  prazo_aprovado?: bigint | null
  taxa_juros_anual?: number | null
  valor_itbi?: number | null
  valor_avaliacao?: number | null
  credito_aprovado?: number | null
  agencia_numero?: string | null
  agencia_funcional_gerente?: string | null
  id_cliente_most?: bigint | null
  ltv?: string | null
  prazo?: bigint | null
  cet?: number | null
  valor_solicitado?: number | null
  id_status_most?: bigint | null
  id_situacao_most?: bigint | null
  id_substatus_most?: bigint | null
  status_laudo?: string | null
  data_abertura_laudo?: string | null
  data_encerramento_laudo?: string | null
  data_agendamento?: string | null
  data_implantacao_contrato?: string | null
  valor_fgts?: number | null
  valor_compra_venda?: number | null
  valor_tarifas?: number | null
  total_credito?: number | null
  id_incorporadora?: bigint | null
  id_empreendimento?: bigint | null
  id_bloco?: bigint | null
  id_unidade?: bigint | null
  id_anexo?: bigint | null
  unidade?: string | null
  anexo?: string | null
  bloco?: string | null
  proposal_uuid?: string | null
  total_documentps?: bigint | null
  proposta_copiada?: boolean | null
  id_cliente_incorporador?: bigint | null
  id_produto?: bigint | null
}

export interface IItauProposalRepository {
  save(
    details: ItauProposalDetails,
    clientMostId?: bigint
  ): Promise<IItauProposalData>
}
