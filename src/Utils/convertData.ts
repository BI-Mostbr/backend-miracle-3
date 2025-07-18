export function convertDateBrToIso(dateBR: string) {
  const [dia, mes, ano] = dateBR.split('/')
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}
