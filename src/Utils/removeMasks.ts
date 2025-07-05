export function cleanMoney(value: string | number): number {
  if (typeof value === 'number') {
    return value
  }

  const normalized = value
    .toString()
    .replace(/[R$\s.]/g, '')
    .replace(',', '.')

  return parseFloat(normalized) || 0
}

export function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}
