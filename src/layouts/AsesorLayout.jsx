import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/asesor/dashboard' },
  { label: 'Socios', path: '/asesor/socios' },
  { label: 'Créditos', path: '/asesor/creditos' },
  { label: 'Reprogramaciones', path: '/asesor/reprogramaciones' },
  { label: 'Caja', path: '/asesor/caja' },
  { label: 'Punto de Reclamo', path: '/asesor/reclamos' },
  { label: 'Feedback de clientes', path: '/asesor/feedback' },
]

export default function AsesorLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
