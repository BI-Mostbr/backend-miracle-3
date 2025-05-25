export interface ItauApiPayload {
  product: string
  property_type: string
  property_price: number
  down_payment: number
  fgts_value: number
  insurance_company: string
  amortization_system: string
  fee_type: string
  period: number
  include_registry_costs: boolean
  include_property_evaluation: boolean
  registry_costs_percentage: number
  proponents: Array<{
    birth_date: string
    income: number
    document_number: string
  }>
  offers: Array<{
    id_offer: number
  }>
}
