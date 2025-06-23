import { ProposalDetailsService } from '@domain/services/ProposalDetails.service';
import { Request, Response } from 'express'

export class ProposalDetailsController {
  constructor(private readonly proposalDetailsService: ProposalDetailsService) {}

  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const id_proposta = req.query.id_proposta as string;
      const response = await this.proposalDetailsService.getLogs(id_proposta);
      
      res.json(response)
    } catch (error) {
      console.error('Error in get logs:', error)

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }
}
