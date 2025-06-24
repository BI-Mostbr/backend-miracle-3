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
