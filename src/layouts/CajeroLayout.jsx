import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/cajero/dashboard' },
  { label: 'Caja', path: '/cajero/caja' },
  { label: 'Plazo Fijo', path: '/cajero/plazo-fijo' },
  { label: 'Socios', path: '/cajero/socios' },
]

export default function CajeroLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
