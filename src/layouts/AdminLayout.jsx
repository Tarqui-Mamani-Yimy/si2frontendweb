import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Registrar usuario', path: '/admin/usuarios/nuevo' },
  { label: 'Usuarios', path: '/admin/usuarios' },
  { label: 'Roles y permisos', path: '/admin/roles' },
  { label: 'Socios', path: '/admin/socios' },
  { label: 'Créditos', path: '/admin/creditos' },
  { label: 'Caja', path: '/admin/caja' },
  { label: 'Reportes', path: '/admin/reportes' },
  { label: 'Bitácora', path: '/admin/bitacora' },
  { label: 'Configuración', path: '/admin/configuracion' },
]

export default function AdminLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
