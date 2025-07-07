export function genderSantander(value: string) {
  let gender = 'masculino'

  if (value === 'feminino') {
    gender = 'F'
  } else {
    gender = 'M'
  }

  return gender
}
