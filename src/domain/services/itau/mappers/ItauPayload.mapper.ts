import { CreditSimulation } from '@domain/entities'
import { ItauApiPayload } from '../types/itauApiTypes'
import { mapToPropertyTypeItau } from 'Utils/mapToProperty'
import { mapToFeeTypeItau } from 'Utils/mapToFeeType'
import { convertDateBrToIso } from 'Utils/convertData'
import { productItau } from 'Utils/mapToProduct'

export class ItauPayloadMapper {
  static convertToPayload(simulation: CreditSimulation): ItauApiPayload {
    const downPayment = simulation.propertyValue - simulation.financingValue
    const propertyType = mapToPropertyTypeItau(simulation.propertyType)
    const feeType = mapToFeeTypeItau(simulation.financingRate)
    const birthDate = convertDateBrToIso(simulation.customerBirthDate)
    const productType = productItau(simulation.productType)

    return {
      productType: productType,
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
