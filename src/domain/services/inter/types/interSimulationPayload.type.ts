export interface InterSimulationPayload {
  cliente: Array<{
    dataNascimento: string
  }>
  tipoProduto: string
  valorEntrada: number
  quantidadeParcelas: number
  valorSolicitado: number
  imovel: Array<{
    valor: number
    categoria: string
    estado: string
  }>
}
