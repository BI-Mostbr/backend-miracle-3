import { z } from 'zod'

export const CreditSimulationRequestSchema = z
  .object({
    customerCpf: z
      .string()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
      .transform((cpf) => cpf.replace(/\D/g, '')),

    customerName: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    propertyType: z
      .string()
      .min(1, 'Tipo de imóvel é obrigatório')
      .max(50, 'Tipo de imóvel deve ter no máximo 50 caracteres'),
    customerBirthDate: z.string(),
    productType: z
      .string()
      .min(1, 'Tipo de produto é obrigatório')
      .max(50, 'Tipo de produto deve ter no máximo 50 caracteres'),
    financingRate: z
      .string()
      .min(1, 'Taxa de financiamento é obrigatória')
      .max(30, 'Taxa de financiamento deve ter no máximo 30 caracteres'),
    amortizationType: z
      .string()
      .min(1, 'Tipo de amortização é obrigatório')
      .max(50, 'Tipo de amortização deve ter no máximo 50 caracteres'),
    userId: z
      .number()
      .int('ID do usuário deve ser um número inteiro')
      .positive('ID do usuário deve ser positivo'),
    propertyValue: z
      .number()
      .positive('Valor do imóvel deve ser positivo')
      .min(50000, 'Valor mínimo do imóvel: R$ 50.000')
      .max(10000000, 'Valor máximo do imóvel: R$ 10.000.000'),

    downPayment: z
      .number()
      .min(0, 'Entrada não pode ser negativa')
      .max(50000000, 'Valor máximo da entrada: R$ 50.000.000'),

    financingValue: z
      .number()
      .positive('Valor do financiamento deve ser positivo')
      .min(98000, 'Valor mínimo de financiamento: R$ 98.000')
      .max(50000000, 'Valor máximo de financiamento: R$ 50.000.000'),

    installments: z
      .number()
      .int('Número de parcelas deve ser inteiro')
      .min(60, 'Mínimo de 60 parcelas')
      .max(420, 'Máximo de 420 parcelas (35 anos)')
  })
  .refine(
    (data) => data.financingValue <= data.propertyValue - data.downPayment,
    {
      message:
        'Valor do financiamento não pode exceder valor do imóvel menos entrada',
      path: ['financingValue']
    }
  )

export const BankNameParamSchema = z.object({
  bankName: z
    .string()
    .min(1, 'Nome do banco é obrigatório')
    .transform((name) => name.trim().toLowerCase())
})
