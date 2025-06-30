import { ClientRepository } from '@infra/repositories/Client.repository'
import { InterProposalRepository } from '@infra/repositories/InterProposal.repository'
import { ItauProposalRepository } from '@infra/repositories/ItauProposal.repository'
import { PrismaClient } from '@prisma/client'

export class ProposalRepositoryFactory {
  private static prisma: PrismaClient

  static getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error']
      })
    }
    return this.prisma
  }

  static createClientRepository(): ClientRepository {
    return new ClientRepository(this.getPrismaClient())
  }

  static createItauProposalRepository(): ItauProposalRepository {
    return new ItauProposalRepository(this.getPrismaClient())
  }

  static createInterProposalRepository(): InterProposalRepository {
    return new InterProposalRepository(this.getPrismaClient())
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
    }
  }
}
