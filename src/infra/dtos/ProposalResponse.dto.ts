export interface ProposalOferta {
  url: string
  id: string
  banco: string
  status: string
  credito_solicitado: string
  credito_aprovado: string
  taxa_juros: string
  observacao: string[]
}

export interface ProposalResponseData {
  cpf: string
  nome: string
  ofertas: ProposalOferta[]
}

export interface ProposalApiResponse {
  data: ProposalResponseData
}

export interface StatusMapping {
  [key: string]: string
}

export const STATUS_MAPPING: StatusMapping = {
  ENVIADO: 'Aguardando Processamento',
  PENDENTE: 'Em Análise',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  CANCELADO: 'Cancelado',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_DOCUMENTOS: 'Aguardando Documentos',
  ERRO: 'Erro no Processamento'
}

export const BANK_LOGOS: { [key: string]: string } = {
  itau: 'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos//logoItau.png',
  inter:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos//logo-inter.png',
  santander:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos//logoSantander.png',
  bradesco:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos//logo_bradesco.png',
  caixa:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos//logo-caixa.png'
}

export const BANK_IDS: { [key: string]: string } = {
  itau: '1',
  santander: '2',
  bradesco: '3',
  caixa: '4',
  inter: '5'
}
