import { z } from 'zod'

export const EvolucaoTeoricaParamSchema = z.object({
  proposalNumber: z
    .string()
    .regex(/^\d+$/, 'Número da proposta deve conter apenas dígitos')
    .min(1, 'Número da proposta é obrigatório')
})

export type EvolucaoTeoricaParamType = z.infer<
  typeof EvolucaoTeoricaParamSchema
>
