import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Registrar usuario', path: '/admin/usuarios/nuevo' },
  { label: 'Usuarios', path: '/admin/usuarios' },
  { label: 'Roles y permisos', path: '/admin/roles' },
  { label: 'Socios', path: '/admin/socios' },
  { label: 'Solicitudes', path: '/admin/solicitudes' },
  { label: 'Cartera', path: '/admin/cartera' },
  { label: 'Alertas', path: '/admin/alertas' },
  { label: 'Notificaciones', path: '/admin/notificaciones' },
  { label: 'Re-créditos', path: '/admin/recreditos' },
  { label: 'Comité', path: '/admin/comite' },
  { label: 'Ahorros y aportes', path: '/admin/caja' },
  { label: 'Créditos', path: '/admin/creditos' },
  { label: 'Caja', path: '/admin/caja' },
  { label: 'Plan de Cuentas', path: '/admin/plan-cuentas' },
  { label: 'Comprobantes', path: '/admin/comprobantes' },
  { label: 'Libro Diario', path: '/admin/libro-diario' },
  { label: 'Libro Mayor', path: '/admin/libro-mayor' },
  { label: 'Balance de Comprobación', path: '/admin/balance-comprobacion' },
  { label: 'Balance General', path: '/admin/balance-general' },
  { label: 'Estado de Resultados', path: '/admin/estado-resultados' },
  { label: 'Tipos de Cambio', path: '/admin/tipos-cambio' },
  { label: 'Parámetros Contables', path: '/admin/parametros-contables' },
  { label: 'Reportes', path: '/admin/reportes' },
  { label: 'Informes ASFI', path: '/admin/informes-asfi' },
  { label: 'Bitácora', path: '/admin/bitacora' },
  { label: 'Configuración', path: '/admin/configuracion' },
]

export default function AdminLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
