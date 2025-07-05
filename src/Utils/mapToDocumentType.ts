export function mapToDocumentTypeSantander(value: string) {
  let documentType = '1339'

  switch (value) {
    case 'cnh':
      documentType = '1336'
      break
    case 'rg':
      documentType = '1339'
      break
    case 'carteira_de_trabalho':
      documentType = '839'
      break
    case 'rne':
      documentType = '1628'
      break
  }

  return documentType
}
