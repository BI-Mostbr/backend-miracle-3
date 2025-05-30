import { ItauSimulationRepository } from '@infra/repositories/ItauSimulation.repository'
import { PrismaClient } from '@prisma/client'

export class RepositoryFactory {
  private static prisma: PrismaClient

  static getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error']
      })
    }
    return this.prisma
  }

  static createItauRepository(): ItauSimulationRepository {
    return new ItauSimulationRepository(this.getPrismaClient())
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
    }
  }
}
