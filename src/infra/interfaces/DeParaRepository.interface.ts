export interface StatusDeParaResult {
  id_status_most: bigint | null
  id_situacao_most: bigint | null
}

export interface StatusNameResult {
  nome_status: string
  situacao: string
}

export interface IDeParaRepository {
  findStatusByGlobalStatus(
    statusGlobal: string,
    idBanco: number
  ): Promise<StatusDeParaResult>

  getStatusNameByIds(
    idStatusMost: bigint | null,
    idSituacaoMost: bigint | null
  ): Promise<StatusNameResult>

  getProposalStatusByCpfAndBank(
    cpf: string,
    bankName: string
  ): Promise<StatusNameResult>
}
