export function mapToMatrimonialRegimeSantander(
  value: string | null | undefined
): string | null {
  if (!value || value === '') {
    return null
  }

  switch (value) {
    case 'participacao_final_dos_aquestos':
      return 'A'
    case 'separacao_de_bens_obrigatoria_por_lei':
      return 'O'
    case 'comunhao_parcial_de_bens':
      return 'P'
    case 'separacao_de_bens':
      return 'S'
    case 'comunhao_universal_de_bens':
      return 'U'
    default:
      return null // Retorna null para valores não mapeados
  }
}
