import { PrismaClient } from '@prisma/client'

export class PerformanceRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(column: string, id_consultor_most: number, page: number, limit: number, situacao: string | undefined, status: string | undefined, tempo_periodo: string | undefined, cpf_cliente: string | undefined): Promise<any> {
    const skip = (page - 1) * limit;
    const whereFilter: any = {
      [column]: id_consultor_most,
    };

    if (situacao) {
      whereFilter.situacao = situacao;
    };
    if (status) {
      whereFilter.status = status;
    };
    if (tempo_periodo) {
      whereFilter.data_cadastro_int = {
        gte: Number(tempo_periodo),
      };
    };
     if (cpf_cliente) {
      whereFilter.cpf_cliente = cpf_cliente;
    };
    
    const data = await this.prisma.vw_meu_desempenho.findMany({
      where: whereFilter,
      skip,
      take: limit,
      orderBy: {
        data_cadastro_int: 'desc',
      },
    });
    
    return data;
  }
}