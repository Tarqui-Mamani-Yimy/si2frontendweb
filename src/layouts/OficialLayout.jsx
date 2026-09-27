import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/oficial/dashboard' },
  { label: 'Solicitudes', path: '/oficial/solicitudes' },
  { label: 'Cartera', path: '/oficial/cartera' },
  { label: 'Plazo Fijo', path: '/oficial/plazo-fijo' },
  { label: 'Créditos', path: '/oficial/creditos' },
  { label: 'Socios', path: '/oficial/socios' },
]

export default function OficialLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
