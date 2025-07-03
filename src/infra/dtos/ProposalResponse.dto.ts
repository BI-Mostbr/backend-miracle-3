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
  itau: 'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_itau.png',
  inter:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_inter.png',
  santander:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_santander.png',
  bradesco:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_bradesco.png',
  bb: 'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_bb.png',
  caixa:
    'https://qpakafibmkvtswvwsmek.supabase.co/storage/v1/object/public/logoBancos/logo_caixa.png'
}

export const BANK_IDS: { [key: string]: string } = {
  itau: '1',
  inter: '2',
  santander: '3',
  bradesco: '4',
  bb: '5',
  caixa: '6'
}
