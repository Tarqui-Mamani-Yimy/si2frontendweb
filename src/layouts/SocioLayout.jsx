import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/socio/dashboard' },
  { label: 'Mi Cuenta', path: '/socio/mi-cuenta' },
  { label: 'Mis Créditos', path: '/socio/mis-creditos' },
  { label: 'Mis Reclamos', path: '/socio/reclamos' },
  { label: 'Notificaciones', path: '/socio/notificaciones', modulo: 'notificaciones_socios' },
  { label: 'Calificar servicio', path: '/socio/calificar' },
]

export default function SocioLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
