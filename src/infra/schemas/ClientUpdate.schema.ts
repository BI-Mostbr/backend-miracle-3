import { z } from 'zod'

export const UpdateDecisionBankRequestSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF deve ter no máximo 14 caracteres'),
  idProposta: z.string().min(1, 'ID da proposta é obrigatório'),
  idBanco: z.number().int().positive('ID do banco deve ser um número positivo')
})

export const RemoveDecisionBankRequestSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF deve ter no máximo 14 caracteres')
})

export const UpdateResponsibleUserRequestSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF deve ter no máximo 14 caracteres'),
  idConsultor: z
    .number()
    .int()
    .positive('ID do consultor deve ser um número positivo')
})

export const UpdatePartnerRequestSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF deve ter no máximo 14 caracteres'),
  idPartner: z
    .number()
    .int()
    .positive('ID do parceiro deve ser um número positivo')
})

export const UpdateClientNameRequestSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter pelo menos 11 dígitos')
    .max(14, 'CPF deve ter no máximo 14 caracteres'),
  clientName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
})

export type UpdateDecisionBankRequest = z.infer<
  typeof UpdateDecisionBankRequestSchema
>
export type RemoveDecisionBankRequest = z.infer<
  typeof RemoveDecisionBankRequestSchema
>
export type UpdateResponsibleUserRequest = z.infer<
  typeof UpdateResponsibleUserRequestSchema
>
export type UpdatePartnerRequest = z.infer<typeof UpdatePartnerRequestSchema>
export type UpdateClientNameRequest = z.infer<
  typeof UpdateClientNameRequestSchema
>
