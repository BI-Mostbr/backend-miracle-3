import { ProposalDetails } from '@domain/entities'

export class ProposalDetailsMapper {
  static convertToFrontendResponse(data: ProposalDetails[]) {
    const reponse = data.map((item) => {
      return {
        id_faseProposta: item.id_faseProposta ?? null,
        created_at: item.created_at,
        // id_cliente: item.id_cliente ?? null,
        id_proposta: item.id_proposta,
        id_de_status_most: item.id_de_status_most ?? null,
        id_de_situacao_most: item.id_de_situacao_most ?? null,
        // id_de_status_banco: item.id_de_status_banco ?? null,
        // id_de_substatus_banco: item.id_de_substatus_banco ?? null,
        // id_para_status_most: item.id_para_status_most ?? null,
        // id_para_situacao_most: item.id_para_situacao_most ?? null,
        // id_para_status_banco: item.id_para_status_banco ?? null,
        // id_para_substatus_banco: item.id_para_substatus_banco ?? null,
        // id_banco: item.id_banco ?? null,
        // id_usuario: item.id_usuario ?? null,
        de_status_banco: item.de_status_banco,
        para_status_banco: item.para_status_banco
      }
    })

    return { data: reponse.reverse() }
  }
}
