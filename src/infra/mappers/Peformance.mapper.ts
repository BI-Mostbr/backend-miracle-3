import { Performance } from '@domain/entities'

export class PerformanceMapper {
   static convertToFrontendResponse(data: Performance[]) {    
    const reponse = data.map((item) => {
      const id_proposta = item.id_itau ?? item.id_santander ?? item.id_bradesco ?? item.id_cef ?? null

      return {
        cpf_cliente: item.cpf_cliente,
        nome_cliente: item.nome_cliente,
        consultor: item.consultor,
        status: item.status,
        situacao: item.situacao,
        banco: item.banco,
        valor_imovel: item.valor_imovel,
        valor_financiamento: item.valor,
        id: Number(item.id),
        id_cliente: item.id_cliente,
        taxa_juros: item.taxa_juros,
        data_cadastro: item.data_cadastro,
        id_proposta,
        gerente: item.gerente,
        parceiro: item.parceiro,
        ltv: item.ltv
      }
    })

    return { data: reponse }
  }
}
