export interface ProposalDetails {
  id_faseProposta: number;
  created_at: Date;
  id_cliente: number;
  id_proposta: string;
  id_de_status_most: number;
  id_de_situacao_most: number;
  id_de_status_banco: number | null;
  id_de_substatus_banco: number | null;
  id_para_status_most: number;
  id_para_situacao_most: number;
  id_para_status_banco: number | null;
  id_para_substatus_banco: number | null;
  id_banco: number;
  id_usuario: number | null;
  de_status_banco: string | null;
  para_status_banco: string | null;
}

export interface ProposalDetailsResponse {
  id_faseProposta: number;
  created_at: Date;
  id_proposta: string | null;
  id_de_status_most: string |  number | null;
  id_de_situacao_most: string | number | null;
  id_para_status_most: string | number | null;
  id_para_situacao_most: string | number | null;
  de_status_banco: string | null;
  para_status_banco: string | null;
}