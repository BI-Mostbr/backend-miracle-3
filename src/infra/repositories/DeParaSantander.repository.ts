import { PrismaClient } from '@prisma/client'

export class DeParaSantanderRepository {
  constructor(private prisma: PrismaClient) {}

  async findStatusByGlobalStatus(statusGlobal: string) {
    try {
      const result = await this.prisma.tb_depara.findFirst({
        where: {
          status: statusGlobal,
          id_banco: 2 // Santander
        },
        select: {
          id_status_most: true,
          id_situacao_most: true
        }
      })

      if (!result) {
        throw new Error(`Status global ${statusGlobal} não encontrado`)
      }

      return {
        id_status_most: result.id_status_most,
        id_situacao_most: result.id_situacao_most
      }
    } catch (error) {
      console.error('Erro no repositório DeParaSantander:', error)
      throw new Error(`Falha ao buscar status: ${(error as Error).message}`)
    }
  }
}
