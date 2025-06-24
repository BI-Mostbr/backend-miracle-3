import { CreditSimulation } from '@domain/entities'
import { InterSimulationPayload } from '../types/interSimulationPayload.type'
import { mapToPropertyTypeInter } from 'Utils/mapToProperty'
import { productInter } from 'Utils/mapToProduct'

export class InterPayloadMapper {
  static convertToPayload(
    simulation: CreditSimulation
  ): InterSimulationPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue
    const propertyType = mapToPropertyTypeInter(simulation.propertyType)
    const product = productInter(simulation.productType)
    return {
      cliente: {
        dataNascimento: simulation.customerBirthDate
      },
      tipoProduto: product,
      valorEntrada: downPayment,
      quantidadeParcelas: simulation.installments,
      valorSolicitado: simulation.financingValue,
      imovel: {
        valor: simulation.propertyValue,
        categoria: propertyType,
        estado: 'SP'
      }
    }
  }
}
