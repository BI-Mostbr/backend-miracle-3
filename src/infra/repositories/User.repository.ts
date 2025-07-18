import { PrismaClient } from '@prisma/client'

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findUserById(userId: number) {
    if (!userId) {
      throw new Error('ID do usuário não informado')
    }

    try {
      const user = await this.prisma.usuarios.findUnique({
        where: { id_consultor_most: userId },
        select: {
          nome: true,
          email: true,
          id_lider: true,
          cpf: true,
          nome_itau: true,
          id_santander: true
        }
      })
      return user
    } catch (error) {
      throw new Error(`Falha ao buscar usuário: ${(error as Error).message}`)
    }
  }
}
