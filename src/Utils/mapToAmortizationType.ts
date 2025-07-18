export function mapToAmortizationTypeItau(AmortizationType: string): any {}
export function mapToAmortizationTypeSantander(AmortizationType: string): any {
  let amortizationTypeSantander = 'TR_S'

  if (AmortizationType === 'PRICE') {
    amortizationTypeSantander = 'PREF_P'

    return amortizationTypeSantander
  }
}
export function mapToAmortizationTypeInter(AmortizationType: string): any {}
export function mapToAmortizationTypeBradesco(AmortizationType: string): any {}
