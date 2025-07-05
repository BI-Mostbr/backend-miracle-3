import { ISantanderSimulationRepository } from '@infra/interfaces'
import { ClientRepository } from '@infra/repositories/Client.repository'
import { DeParaRepository } from '@infra/repositories/DePara.repository'
import { InterProposalRepository } from '@infra/repositories/InterProposal.repository'
import { InterSimulationRepository } from '@infra/repositories/InterSimulation.repostory'
import { ItauProposalRepository } from '@infra/repositories/ItauProposal.repository'
import { ItauSimulationRepository } from '@infra/repositories/ItauSimulation.repository'
import { ProfessionRepository } from '@infra/repositories/Professions.repository'
import { SantanderSimulationRepository } from '@infra/repositories/SantanderSimulation.repository'
import { UserRepository } from '@infra/repositories/User.repository'
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

  static createSantanderRepository(): ISantanderSimulationRepository {
    return new SantanderSimulationRepository(this.getPrismaClient())
  }

  static createInterRepository(): InterSimulationRepository {
    return new InterSimulationRepository(this.getPrismaClient())
  }

  static createItauProposalRepository(): ItauProposalRepository {
    return new ItauProposalRepository(this.getPrismaClient())
  }

  static createInterProposalRepository(): InterProposalRepository {
    return new InterProposalRepository(this.getPrismaClient())
  }

  static createClientRepository(): ClientRepository {
    return new ClientRepository(this.getPrismaClient())
  }

  static createUserRepository(): UserRepository {
    return new UserRepository(this.getPrismaClient())
  }

  static ProfessionRepository(): ProfessionRepository {
    return new ProfessionRepository(this.getPrismaClient())
    
  static createDeParaRepository(): DeParaRepository {
    return new DeParaRepository(this.getPrismaClient())
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
    }
  }
}
