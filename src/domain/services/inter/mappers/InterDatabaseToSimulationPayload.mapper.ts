import { CreditSimulation } from '@domain/entities'
import { IInterSimulationResponse } from '@infra/interfaces/InterSimulationResponse.interface'

export class InterDbToSimulationMapper {
  static mapToSimulation(
    interData: IInterSimulationResponse
  ): CreditSimulation {
    return {
      customerCpf: interData.cpf || '',
      customerName: '',
      customerBirthDate: interData.data_nasc || '',
      propertyValue: interData.valorImovel || 0,
      financingValue: interData.valorSolicitado || 0,
      installments: Number(interData.quantidadeParcelas) || 0,
      productType: interData.tipoProduto || '',
      propertyType: interData.categoriaImovel || '',
      financingRate: 'padrao',
      amortizationType: interData.sistemaAmortizacao || '',
      userId: Number(interData.id_usuario) || 0
    }
  }
}
