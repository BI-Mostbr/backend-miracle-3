export function mapToStatusSantander(status: string): string {
  console.log('🔍 Mapping Santander status:', status)
  if (status === '505' || status === '25' || status === '523') {
    return 'APROVADO'
  } else if (
    status === '509' ||
    status === '510' ||
    status === '511' ||
    status === '12'
  ) {
    return 'PENDENTE'
  } else if (status === '513') {
    return 'APROVADO A MENOR'
  } else if (
    status === '524' ||
    status === '540' ||
    status === '516' ||
    status === '514'
  ) {
    return 'REPROVADO'
  } else {
    return 'EM VALIDAÇÃO'
  }
}
