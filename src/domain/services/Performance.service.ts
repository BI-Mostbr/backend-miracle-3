import { CreditSimulation } from '@domain/entities'
import { PerformanceRepository } from '@infra/repositories/Performance.repository'
import { formatRangeDate } from 'utils/formateRangeDate';

export class PerformanceService {
  constructor(private repository: PerformanceRepository) {}

  async getPerformance(id_cargo: number, id_consultor_most: number, page: number, limit: number, situacao: string | undefined, status: string | undefined, tempo_periodo: string | undefined, cpf_cliente: string | undefined): Promise<{data: Performance}> {
    const columnMap: Record<number, string> = {
      3: 'id_gerente_real',
      15: 'id_consultor',
      13: 'id_gerente',
      5: 'id_consultor',
      6: 'id_usuario_parceiro',
      7: 'id_usuario_sub_parceiro',
      2: 'id_diretor',
      1: 'id_master'
    };

    let formatDate;
    if (tempo_periodo) {
      formatDate = formatRangeDate(tempo_periodo ?? '');
    };

    const column = columnMap[id_cargo];
    const data = await this.repository.findAll(column, id_consultor_most, page, limit, situacao, status, formatDate, cpf_cliente)
    
    return {
      data
    }
  }
}