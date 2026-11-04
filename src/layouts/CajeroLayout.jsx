import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/cajero/dashboard' },
  { label: 'Caja', path: '/cajero/caja' },
  { label: 'Créditos', path: '/cajero/cartera' },
  { label: 'Plazo Fijo', path: '/cajero/plazo-fijo' },
  { label: 'Socios', path: '/cajero/socios' },
  { label: 'Notificaciones', path: '/cajero/notificaciones', modulo: 'notificaciones_socios' },
]

export default function CajeroLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
