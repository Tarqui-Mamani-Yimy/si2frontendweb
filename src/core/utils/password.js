export const PASSWORD_MIN_LENGTH = 10

// Sin anclas ^/$: se usa tal cual en el atributo HTML `pattern`, que ya
// ancla implícitamente contra el valor completo del input.
export const PASSWORD_PATTERN =
  '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{10,}'

export const PASSWORD_HINT =
  `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con al menos una mayúscula, una minúscula, ` +
  'un número y un carácter especial.'

const PASSWORD_REGEX = new RegExp(`^${PASSWORD_PATTERN}$`)

export function isPasswordValid(password) {
  return PASSWORD_REGEX.test(password ?? '')
}
