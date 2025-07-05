export function phoneRegexSantander(value: string) {
  const telefone = value
  const numeros = telefone.replace(/\D/g, '')

  const regex = /^(\d{2})(\d{4,5})(\d{4})$/
  const resultado = numeros.match(regex)

  if (resultado) {
    const ddd = resultado[1]
    const numero = resultado[2] + resultado[3]
    return { ddd, numero }
  }

  return { ddd: 'número inválido', numero: 'número inválido' }
}
