import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/contador/dashboard' },
  { label: 'Plan de Cuentas', path: '/contador/plan-cuentas' },
  { label: 'Comprobantes', path: '/contador/comprobantes' },
  { label: 'Libro Diario', path: '/contador/libro-diario' },
  { label: 'Libro Mayor', path: '/contador/libro-mayor' },
  { label: 'Balance de Comprobación', path: '/contador/balance-comprobacion' },
  { label: 'Parámetros Contables', path: '/contador/parametros-contables' },
  { label: 'Comité', path: '/contador/comite' },
  { label: 'Reportes', path: '/contador/reportes' },
  { label: 'Cumplimiento', path: '/contador/cumplimiento' },
]

export default function ContadorLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
