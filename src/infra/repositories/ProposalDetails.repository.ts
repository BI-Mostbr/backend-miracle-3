import { PrismaClient } from '@prisma/client'
import { ProposalDetailsResponse } from '@domain/entities'

export class ProposalDetailsRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(id_proposta: string): Promise<ProposalDetailsResponse[]> {
    try {
      const response = await this.prisma.tb_fasePropostas_log.findMany({
          where: {
            id_proposta
          },
          select: {
            id_faseProposta: true,
            created_at: true,
            id_proposta: true,
            id_de_status_most: true,
            id_para_status_most: true,
            id_de_situacao_most: true,
            id_para_situacao_most: true,
            de_status_banco: true,
            para_status_banco: true,
          }
        });
      
      return response;
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }

  async findAllStatus(): Promise<any> {
    try {
      const response = await this.prisma.tb_status.findMany();
      return response;
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }

  async findAllSituation(): Promise<any> {
    try {
      const response = await this.prisma.tb_situacao.findMany();
      
      return response;
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  }
}