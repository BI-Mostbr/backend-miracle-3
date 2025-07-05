export function maritalStatusSantander(value: string) {
  let maritalStatus = '1'

  switch (value) {
    case 'casado':
      maritalStatus = '2'
      break
    case 'desquitado':
      maritalStatus = '3'
      break
    case 'divorciado':
      maritalStatus = '4'
      break
    case 'separado judicialmente':
      maritalStatus = '9'
      break
    case 'solteiro':
      maritalStatus = '1'
      break
    case 'viuvo':
      maritalStatus = '5'
      break
  }

  return maritalStatus
}
