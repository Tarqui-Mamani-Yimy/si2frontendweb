/**
 * Constants and nomenclature helpers for Plan de Cuentas (MCEF ASFI Título II).
 */

export const CLASES_CONTABLES = [
  {
    id: 1,
    codigo: '100',
    nombre: 'Activo',
    naturaleza: 'DEUDORA',
    badgeVariant: 'teal',
    descripcion: 'Recursos económicos controlados por la entidad.',
  },
  {
    id: 2,
    codigo: '200',
    nombre: 'Pasivo',
    naturaleza: 'ACREEDORA',
    badgeVariant: 'navy',
    descripcion: 'Obligaciones presentes derivadas de hechos pasados.',
  },
  {
    id: 3,
    codigo: '300',
    nombre: 'Patrimonio',
    naturaleza: 'ACREEDORA',
    badgeVariant: 'indigo',
    descripcion: 'Participación residual en los activos tras deducir pasivos.',
  },
  {
    id: 4,
    codigo: '400',
    nombre: 'Gastos',
    naturaleza: 'DEUDORA',
    badgeVariant: 'rose',
    descripcion: 'Disminuciones en beneficios económicos (MCEF Título II).',
  },
  {
    id: 5,
    codigo: '500',
    nombre: 'Ingresos',
    naturaleza: 'ACREEDORA',
    badgeVariant: 'green',
    descripcion: 'Incrementos en beneficios económicos durante el ejercicio.',
  },
  {
    id: 6,
    codigo: '600',
    nombre: 'Cuentas Contingentes Deudoras',
    naturaleza: 'DEUDORA',
    badgeVariant: 'purple',
    descripcion: 'Derechos eventuales que pueden derivar en activos.',
  },
  {
    id: 7,
    codigo: '700',
    nombre: 'Cuentas Contingentes Acreedoras',
    naturaleza: 'ACREEDORA',
    badgeVariant: 'amber',
    descripcion: 'Obligaciones eventuales sujetas a condiciones futuras.',
  },
  {
    id: 8,
    codigo: '800',
    nombre: 'Cuentas de Orden Deudoras',
    naturaleza: 'DEUDORA',
    badgeVariant: 'orange',
    descripcion: 'Registro de operaciones fiduciarias y de control.',
  },
  {
    id: 9,
    codigo: '900',
    nombre: 'Cuentas de Orden Acreedoras',
    naturaleza: 'ACREEDORA',
    badgeVariant: 'slate',
    descripcion: 'Contrapartida de control y custodia de valores.',
  },
]

export const NIVELES_CONTABLES = {
  1: { nombre: 'Clase', digitos: 'X00.00', esAgrupadora: true },
  2: { nombre: 'Grupo', digitos: 'XX0.00', esAgrupadora: true },
  3: { nombre: 'Cuenta', digitos: 'XXX.00', esAgrupadora: true },
  4: { nombre: 'Subcuenta', digitos: 'XXX.NN', esAgrupadora: false },
  5: { nombre: 'Analítica', digitos: 'XXX.NN.NN', esAgrupadora: false },
}

export function getNivelNombre(nivel) {
  return NIVELES_CONTABLES[nivel]?.nombre || `Nivel ${nivel}`
}
