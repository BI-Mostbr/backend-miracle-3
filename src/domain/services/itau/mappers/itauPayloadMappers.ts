import { CreditSimulation } from '@domain/entities'
import { ItauApiPayload } from '../types/itauApiTypes'

export class ItauPayloadMapper {
  static convertToPayload(simulation: CreditSimulation): ItauApiPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue

    return {
      product: simulation.productType,
      property_type: simulation.propertyType,
      property_price: simulation.propertyValue,
      down_payment: downPayment,
      fgts_value: 0.0,
      insurance_company: 'ITAU',
      amortization_system: simulation.amortizationType,
      fee_type: simulation.financingRate,
      period: simulation.installments,
      include_registry_costs: false,
      include_property_evaluation: false,
      registry_costs_percentage: 0.0,
      proponents: [
        {
          birth_date: simulation.customerBirthDate,
          income: 2000000,
          document_number: simulation.customerCpf
        }
      ],
      offers: [
        {
          id_offer: 1
        }
      ]
    }
  }
}
