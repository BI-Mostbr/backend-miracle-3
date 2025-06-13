export interface InterSimulationPayload {
  cliente: {
    dataNascimento: string
  }
  tipoProduto: string
  valorEntrada: number
  quantidadeParcelas: number
  valorSolicitado: number
  imovel: {
    valor: number
    categoria: string
    estado: string
  }
}
