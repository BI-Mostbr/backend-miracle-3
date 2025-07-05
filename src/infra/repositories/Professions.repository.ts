import { PrismaClient } from '@prisma/client'

export class ProfessionRepository {
  constructor(private prisma: PrismaClient) {}
  async findProfessionById(id: string) {
    const idProfession = Number(id)
    try {
      const profession = await this.prisma.profissoes.findUnique({
        where: {
          id: idProfession
        },
        select: {
          id_key: true,
          keyDescription: true
        }
      })

      return profession
    } catch (error) {
      throw new Error('Profissão não encontrada.')
    }
  }
}
