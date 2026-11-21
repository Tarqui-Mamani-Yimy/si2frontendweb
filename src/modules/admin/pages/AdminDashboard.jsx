import StaffDashboardSummary from '../../../shared/components/StaffDashboardSummary'
import SubscriptionCard from '../../../shared/components/SubscriptionCard'

export default function AdminDashboard() {
  return (
    <StaffDashboardSummary
      role="ADMINISTRADOR"
      subscriptionSlot={<SubscriptionCard />}
    />
  )
}
