import { ProposalDetailsResponse } from '@domain/entities';
import { ProposalDetailsRepository } from '@infra/repositories/ProposalDetails.repository'

export class ProposalDetailsService {
  constructor(private repository: ProposalDetailsRepository) {}

  async getLogs(id_proposta: string): Promise<ProposalDetailsResponse[]> {
    const dataProposal = await this.repository.findAll(id_proposta);
    const allStatus = await this.repository.findAllStatus();
    const allSituation = await this.repository.findAllSituation();

    const statusList = allStatus.map((item: any) => ({
      id: Number(item.id),
      status: item.status
    }));

    const situationList = allSituation.map((item: any) => ({
      id: Number(item.id),
      situacao: item.situacao
    }));

    const transformed = dataProposal.map((item) => ({
      ...item,
      id_de_status_most: statusList.find((s: any) => s.id === item.id_de_status_most)?.status || item.id_de_status_most,
      id_para_status_most: statusList.find((s: any) => s.id === item.id_para_status_most)?.status || item.id_para_status_most,
      id_de_situacao_most: situationList.find((s: any) => s.id === item.id_de_situacao_most)?.situacao || item.id_de_situacao_most,
      id_para_situacao_most: situationList.find((s: any) => s.id === item.id_para_situacao_most)?.situacao || item.id_para_situacao_most,
    }));

    return transformed.reverse();
  }
}