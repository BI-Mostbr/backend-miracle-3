import { CreditSimulation } from '@domain/entities'
import { InterSimulationPayload } from '../types/interSimulationPayload.type'

export class InterPayloadMapper {
  static convertToPayload(
    simulation: CreditSimulation
  ): InterSimulationPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue
    const propertyType =
      simulation.propertyType === 'RESIDENTIAL'
        ? 'CASA_RESIDENCIAL'
        : 'SALA_COMERCIAL'
    return {
      cliente: {
        dataNascimento: simulation.customerBirthDate
      },
      tipoProduto: 'FINANCIAMENTO_IMOBILIARIO',
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
