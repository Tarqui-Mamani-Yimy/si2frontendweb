import BitacoraPage from '../../admin/pages/BitacoraPage'

/**
 * El SuperAdmin ve la misma bitácora global.
 * Como su cooperativa_id es null, el backend devuelve datos de toda la plataforma.
 */
export default function SuperAdminBitacoraPage() {
  return <BitacoraPage />
}
