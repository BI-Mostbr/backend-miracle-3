export function produtoSantander(value: string) {
  let produto = 3

  switch (value) {
    case 'ISOLADO':
      produto = 3
      break
    case 'PILOTO':
      produto = 49
      break
    case 'REPASSE':
      produto = 3
      break
    case 'CGI':
      produto = 4
      break
  }

  return produto
}

export function productInter(product: string): string {
  let produto = 'FINANCIAMENTO_IMOBILIARIO'

  switch (product) {
    case 'ISOLADO':
      produto = 'FINANCIAMENTO_IMOBILIARIO'
      break
    case 'PILOTO':
      produto = 'FINANCIAMENTO_IMOBILIARIO'
      break
    case 'REPASSE':
      produto = 'FINANCIAMENTO_IMOBILIARIO'
      break
    case 'CGI':
      produto = 'HOME_EQUITY'
      break
    default:
      produto = 'FINANCIAMENTO_IMOBILIARIO'
      break
  }

  return produto
}

export function productItau(product: string): string {
  let produto = 'INDIVIDUAL'
  switch (product) {
    case 'ISOLADO':
      produto = 'INDIVIDUAL'
      break
    case 'PILOTO':
      produto = 'PILOT'
      break
    case 'REPASSE':
      produto = 'TRANSFERENCE'
      break
    case 'CGI':
      produto = 'INDIVIDUAL'
      break
    default:
      produto = 'INDIVIDUAL'
      break
  }
  return produto
}
