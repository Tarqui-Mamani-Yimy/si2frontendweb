import { selectUser, useAuthStore } from '../../core/store/authStore'
import StaffDashboardSummary from './StaffDashboardSummary'

export default function DashboardContent() {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || 'STAFF'

  return <StaffDashboardSummary role={roleName} />
}
