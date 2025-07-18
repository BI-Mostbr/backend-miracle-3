export function mapToPropertyTypeItau(propertyType: string): string {
  let property = 'RESIDENTIAL'

  switch (propertyType) {
    case 'Residencial':
      property = 'RESIDENTIAL'
      break
    case 'Comercial':
      property = 'COMMERCIAL'
      break
    default:
      property = 'RESIDENTIAL'
      break
  }
  return property
}

export function mapToPropertyTypeInter(propertyType: string): string {
  let property = 'APARTAMENTO_RESIDENCIAL'

  switch (propertyType) {
    case 'Residencial':
      property = 'APARTAMENTO_RESIDENCIAL'
      break
    case 'Comercial':
      property = 'SALA_COMERCIAL'
      break
    default:
      property = 'APARTAMENTO_RESIDENCIAL'
      break
  }
  return property
}

export function mapToPropertyTypeSantander(propertyType: string): string {
  let property = 'R'

  switch (propertyType) {
    case 'Residencial':
      property = 'R'
      break
    case 'Comercial':
      property = 'C'
      break
    default:
      property = 'R'
      break
  }
  return property
}
