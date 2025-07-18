export function workTypeSantander(value: string) {
  let workType = '4'

  switch (value) {
    case 'assalariado':
      workType = '4'
      break
    case 'aposentado':
      workType = '1'
      break
    case 'socio proprietario':
      workType = '3'
      break
    case 'autonomo':
      workType = '7'
      break
    case 'profissional liberal':
      workType = '7'
      break
  }

  return workType
}
