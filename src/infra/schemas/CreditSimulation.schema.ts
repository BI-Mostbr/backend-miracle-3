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
    .transform((name) => name.trim())
})
