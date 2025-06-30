import { z } from 'zod'

const AddressSchema = z.object({
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  localidade: z.string().min(1, 'Cidade é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  ufRedisence: z.string().length(2, 'UF deve ter 2 caracteres')
})

const PersonSchema = z.object({
  document: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  birthday: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  motherName: z.string().min(2, 'Nome da mãe deve ter pelo menos 2 caracteres'),
  documentType: z.string().min(1, 'Tipo de documento é obrigatório'),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  documentIssuer: z.string().min(1, 'Órgão expedidor é obrigatório'),
  documentIssueDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA'),
  gender: z.enum(['masculino', 'feminino']),
  profession: z.string().min(1, 'Profissão é obrigatória'),
  workType: z.string().min(1, 'Tipo de trabalho é obrigatório'),
  monthlyIncome: z.string().min(1, 'Renda mensal é obrigatória'),
  professionalPosition: z.string().min(1, 'Cargo é obrigatório')
})

export const CreditProposalRequestSchema = z.object({
  fluxo: z.enum(['normal', 'reenvio', 'adicionar-banco']),
  selectedBanks: z
    .array(z.string())
    .min(1, 'Pelo menos um banco deve ser selecionado'),
  selectedProductOption: z.enum([
    'ISOLADO',
    'PILOTO',
    'REPASSE',
    'PORTABILIDADE'
  ]),

  propertyValue: z.string().min(1, 'Valor do imóvel é obrigatório'),
  financedValue: z.string().min(1, 'Valor financiado é obrigatório'),
  term: z.string().min(1, 'Prazo é obrigatório'),
  useFGTS: z.boolean(),
  fgtsValue: z.string().optional(),
  itbiPayment: z.boolean(),
  itbiValue: z.string().optional(),
  amortization: z.string().min(1, 'Tipo de amortização é obrigatório'),
  propertyType: z.string().min(1, 'Tipo de imóvel é obrigatório'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  cities: z.string().optional(),
  situation: z.string().min(1, 'Situação do imóvel é obrigatória'),
  financingRate: z.string().min(1, 'Taxa de financiamento é obrigatória'),

  document: z
    .string()
    .regex(
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      'CPF deve estar no formato XXX.XXX.XXX-XX'
    ),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  birthday: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  motherName: z.string().min(2, 'Nome da mãe deve ter pelo menos 2 caracteres'),
  gender: z.enum(['masculino', 'feminino']),
  documentType: z.string().min(1, 'Tipo de documento é obrigatório'),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  documentIssuer: z.string().min(1, 'Órgão expedidor é obrigatório'),
  documentIssueDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA'),
  ufDataUser: z.string().length(2, 'UF deve ter 2 caracteres'),
  monthlyIncome: z.string().min(1, 'Renda mensal é obrigatória'),
  profession: z.string().min(1, 'Profissão é obrigatória'),
  workType: z.string().min(1, 'Tipo de trabalho é obrigatório'),
  professionalPosition: z.string().min(1, 'Cargo é obrigatório'),
  maritalStatus: z.string().min(1, 'Estado civil é obrigatório'),
  matrimonialRegime: z.string().optional(),
  marriageDate: z.string().optional(),

  cepBankAgency: z.string().min(8, 'CEP deve ter 8 dígitos'),
  agencyBank: z.string().optional(),
  account: z.string().optional(),
  accountId: z.string().optional(),
  agency: z.string().optional(),

  spouse: PersonSchema.extend({
    spouseUfDataUser: z.string().length(2, 'UF deve ter 2 caracteres'),
    spouseContributesIncome: z.boolean(),
    civilStatus: z.string().min(1, 'Estado civil é obrigatório')
  })
    .merge(AddressSchema)
    .optional(),

  secondProponent: PersonSchema.extend({
    uf: z.string().length(2, 'UF deve ter 2 caracteres'),
    spouseContributesIncome: z.boolean(),
    civilStatus: z.string().min(1, 'Estado civil é obrigatório')
  })
    .merge(AddressSchema)
    .optional(),

  construction: z
    .object({
      businessPersonId: z
        .string()
        .min(1, 'ID da pessoa jurídica é obrigatório'),
      enterpriseId: z.string().min(1, 'ID do empreendimento é obrigatório'),
      blockId: z.string().optional(),
      unitId: z.string().optional()
    })
    .optional(),

  portability: z
    .object({
      outstandingBalance: z
        .number()
        .positive('Saldo devedor deve ser positivo'),
      remainingPeriod: z
        .number()
        .int()
        .positive('Prazo restante deve ser positivo'),
      originalPeriod: z
        .number()
        .int()
        .positive('Prazo original deve ser positivo')
    })
    .optional(),

  userId: z.number().int().positive('ID do usuário deve ser positivo'),
  consultorId: z
    .number()
    .int()
    .positive('ID do consultor deve ser positivo')
    .optional(),
  partnerId: z.string().optional()
})

export const BankNameProposalParamSchema = z.object({
  bankName: z
    .string()
    .min(1, 'Nome do banco é obrigatório')
    .transform((name) => name.trim().toLowerCase())
    .refine(
      (name) => ['itau', 'inter', 'santander', 'bradesco'].includes(name),
      {
        message:
          'Banco deve ser um dos seguintes: itau, inter, santander, bradesco'
      }
    )
})
