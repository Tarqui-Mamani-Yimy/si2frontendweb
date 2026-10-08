import AppShell from './components/AppShell'

const NAV_ITEMS = [
  { label: 'Cooperativas', path: '/superadmin/cooperativas' },
  { label: 'Bitácora', path: '/superadmin/bitacora' },
  { label: 'Backups', path: '/superadmin/backups' },
]

export default function SuperAdminLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
