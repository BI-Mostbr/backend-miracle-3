export interface InterProposalPayload {
  tipoProduto: string
  quantidadeParcelas: number
  valorSolicitado: number
  parceiro: number
  imovel: {
    categoria: string
    valor: number
    endereco: {
      estado: string
      cidade: string
    }
  }
  pessoas: InterProposalPerson[]
}

export interface InterProposalPerson {
  tipoPessoa: 'PRINCIPAL' | 'CONJUGE' | 'EXTRA'
  cpf: string
  nome: string
  dtAniversario: string
  telefone: string
  email: string
  estadoCivil: string
  sexo: string
  escolaridade: string
  profissao: string
  tipoRenda: string
  renda: number
  endereco: {
    cep: string
    descricao: string
    bairro: string
    cidade: string
    estado: string
    numero: number
    complemento?: string
  }
  flagFiador: boolean
  flagAdquirente: boolean
  flagAnuente: boolean
}
