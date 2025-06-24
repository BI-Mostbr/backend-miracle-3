import { CreditSimulation } from '@domain/entities'
import { ItauApiPayload } from '../types/itauApiTypes'
import { mapToPropertyTypeItau } from 'Utils/mapToProperty'
import { mapToFeeTypeItau } from 'Utils/mapToFeeType'
import { convertDateBrToIso } from 'Utils/convertData'

export class ItauPayloadMapper {
  static convertToPayload(simulation: CreditSimulation): ItauApiPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue
    const propertyType = mapToPropertyTypeItau(simulation.propertyType)
    const feeType = mapToFeeTypeItau(simulation.financingRate)
    const birthDate = convertDateBrToIso(simulation.customerBirthDate)

    return {
      productType: simulation.productType,
      propertyType: propertyType,
      propertyPrice: simulation.propertyValue,
      amortizationType: simulation.amortizationType,
      feeType: feeType,
      insuranceType: 'ITAU',
      period: simulation.installments,
      downPayment: downPayment,
      includeRegistryCosts: false,
      registryCostsPercentage: 0,
      proponents: [
        {
          document: simulation.customerCpf,
          birthDate: birthDate,
          income: 2000000,
          zipCode: '04571010',
          composeIncome: false
        }
      ]
    }
  }
}
