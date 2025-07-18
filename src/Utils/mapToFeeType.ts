export function mapToFeeTypeItau(feeType: string): any {
  let fee = 'STANDARD'

  switch (fee) {
    case 'Padrão':
      fee = 'STANDARD'
      break
    case 'Poupança':
      fee = 'SAVINGS'
      break
    default:
      fee = 'STANDARD'
      break
  }
  return fee
}
export function mapToFeeTypeSantander(feeType: string): any {}
export function mapToFeeTypeInter(feeType: string): any {}
export function mapToFeeTypeBradesco(feeType: string): any {}
