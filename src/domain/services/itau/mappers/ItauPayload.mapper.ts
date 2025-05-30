import { CreditSimulation } from '@domain/entities'
import { ItauApiPayload } from '../types/itauApiTypes'

export class ItauPayloadMapper {
  static convertToPayload(simulation: CreditSimulation): ItauApiPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue

    return {
      productType: simulation.productType,
      propertyType: simulation.propertyType,
      propertyPrice: simulation.propertyValue,
      amortizationType: 'SAC',
      feeType: simulation.financingRate,
      insuranceType: 'ITAU',
      period: simulation.installments,
      downPayment: downPayment,
      includeRegistryCosts: false,
      registryCostsPercentage: 0,
      proponents: [
        {
          document: simulation.customerCpf,
          birthDate: simulation.customerBirthDate,
          income: 2000000,
          zipCode: '04571010',
          composeIncome: false
        }
      ]
    }
  }
}
