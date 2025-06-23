import { PerformanceService } from '@domain/services/Performance.service';
import { PerformanceMapper } from '@infra/mappers/Peformance.mapper'
import { Request, Response } from 'express'

export class PerformanceController {
  constructor(private readonly myPerformanceService: PerformanceService) {}

  async getPerformance(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const id_cargo = Number(req.query.id_cargo);
      const id_consultor_most = Number(req.query.id_consultor_most);
      const situacao = req.query.situacao as string | undefined;
      const status = req.query.status as string | undefined;
      const tempo_periodo = req.query.tempo_periodo as string | undefined;
      const cpf_cliente = req.query.cpf_cliente as string | undefined;

      const response = await this.myPerformanceService.getPerformance(id_cargo, id_consultor_most, page, limit, situacao, status, tempo_periodo, cpf_cliente)

      const dataFormat = PerformanceMapper.convertToFrontendResponse(response.data as any)
        
      res.json(dataFormat)
    } catch (error) {
      console.error('Error in get performer:', error)

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }
}
