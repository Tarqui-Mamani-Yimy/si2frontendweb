import { Navigate, Route, Routes } from 'react-router-dom'
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
  RootRedirect,
} from './guards'
import AdminLayout from '../layouts/AdminLayout'
import AsesorLayout from '../layouts/AsesorLayout'
import AuthLayout from '../layouts/AuthLayout'
import CajeroLayout from '../layouts/CajeroLayout'
import ContadorLayout from '../layouts/ContadorLayout'
import OficialLayout from '../layouts/OficialLayout'
import SocioLayout from '../layouts/SocioLayout'
import SuperAdminLayout from '../layouts/SuperAdminLayout'

import LoginPage from '../modules/auth/pages/LoginPage'
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage'

// ── SuperAdmin ────────────────────────────────────────────────
import SuperAdminCooperativasPage from '../modules/superadmin/pages/CooperativasPage'
import SuperAdminBitacoraPage from '../modules/superadmin/pages/BitacoraPage'

// ── Admin ─────────────────────────────────────────────────────
import AdminCajaPage from '../modules/admin/pages/CajaPage'
import AdminConfiguracionPage from '../modules/admin/pages/ConfiguracionPage'
import AdminCreditosPage from '../modules/admin/pages/CreditosPage'
import AdminDashboardPage from '../modules/admin/pages/DashboardPage'
import AdminReportesPage from '../modules/admin/pages/ReportesPage'
import AdminSociosPage from '../modules/admin/pages/SociosPage'
import RegistrarSocioPage from '../modules/admin/pages/RegistrarSocio'
import RegistrarUsuarioPage from '../modules/admin/pages/RegistrarUsuarioPage'
import UsuariosPage from '../modules/admin/pages/UsuariosPage'
import RolesPage from '../modules/admin/pages/RolesPage'

// ── Asesor (legacy alias) ─────────────────────────────────────
import AsesorCajaPage from '../modules/asesor/pages/CajaPage'
import AsesorCreditosPage from '../modules/asesor/pages/CreditosPage'
import AsesorDashboardPage from '../modules/asesor/pages/DashboardPage'
import AsesorSociosPage from '../modules/asesor/pages/SociosPage'

// ── Cajero ────────────────────────────────────────────────────
import CajeroCajaPage from '../modules/cajero/pages/CajaPage'
import CajeroDashboardPage from '../modules/cajero/pages/DashboardPage'
import CajeroSociosPage from '../modules/cajero/pages/SociosPage'

// ── Oficial de Crédito ────────────────────────────────────────
import OficialCreditosPage from '../modules/oficial/pages/CreditosPage'
import OficialDashboardPage from '../modules/oficial/pages/DashboardPage'
import OficialSociosPage from '../modules/oficial/pages/SociosPage'

// ── Contador ──────────────────────────────────────────────────
import ContadorCumplimientoPage from '../modules/contador/pages/CumplimientoPage'
import ContadorDashboardPage from '../modules/contador/pages/DashboardPage'
import ContadorReportesPage from '../modules/contador/pages/ReportesPage'

// ── Socio ─────────────────────────────────────────────────────
import SocioDashboardPage from '../modules/socio/pages/DashboardPage'
import SocioMiCuentaPage from '../modules/socio/pages/MiCuentaPage'
import SocioMisCreditosPage from '../modules/socio/pages/MisCreditosPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Rutas públicas (solo accesibles sin sesión) ── */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar" element={<ForgotPasswordPage />} />
          <Route path="/recuperar/:token" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* ── Rutas protegidas (requieren sesión activa) ── */}
      <Route element={<ProtectedRoute />}>

        {/* SUPERADMIN — nivel SaaS, sin cooperativa_id */}
        <Route path="/superadmin" element={<RoleRoute allow="superadmin" />}>
          <Route element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="cooperativas" replace />} />
            <Route path="cooperativas" element={<SuperAdminCooperativasPage />} />
            <Route path="bitacora" element={<SuperAdminBitacoraPage />} />
          </Route>
        </Route>

        {/* ADMINISTRADOR — acceso total dentro de su cooperativa */}
        <Route path="/admin" element={<RoleRoute allow="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="bitacora" element={<AdminDashboardPage />} />
            <Route path="usuarios/nuevo" element={<RegistrarUsuarioPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="socios" element={<AdminSociosPage />} />
            <Route path="socios/nuevo" element={<RegistrarSocioPage />} />
            <Route path="creditos" element={<AdminCreditosPage />} />
            <Route path="caja" element={<AdminCajaPage />} />
            <Route path="reportes" element={<AdminReportesPage />} />
            <Route path="configuracion" element={<AdminConfiguracionPage />} />
          </Route>
        </Route>

        {/* CAJERO / VENTANILLA */}
        <Route path="/cajero" element={<RoleRoute allow="cajero" />}>
          <Route element={<CajeroLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CajeroDashboardPage />} />
            <Route path="caja" element={<CajeroCajaPage />} />
            <Route path="socios" element={<CajeroSociosPage />} />
          </Route>
        </Route>

        {/* OFICIAL DE CRÉDITO / CAMPO */}
        <Route path="/oficial" element={<RoleRoute allow="oficial" />}>
          <Route element={<OficialLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OficialDashboardPage />} />
            <Route path="creditos" element={<OficialCreditosPage />} />
            <Route path="socios" element={<OficialSociosPage />} />
          </Route>
        </Route>

        {/* CONTADOR / CUMPLIMIENTO */}
        <Route path="/contador" element={<RoleRoute allow="contador" />}>
          <Route element={<ContadorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ContadorDashboardPage />} />
            <Route path="reportes" element={<ContadorReportesPage />} />
            <Route path="cumplimiento" element={<ContadorCumplimientoPage />} />
          </Route>
        </Route>

        {/* ASESOR (alias legacy — mantener compatibilidad) */}
        <Route path="/asesor" element={<RoleRoute allow="asesor" />}>
          <Route element={<AsesorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AsesorDashboardPage />} />
            <Route path="socios" element={<AsesorSociosPage />} />
            <Route path="creditos" element={<AsesorCreditosPage />} />
            <Route path="caja" element={<AsesorCajaPage />} />
          </Route>
        </Route>

        {/* SOCIO / CLIENTE */}
        <Route path="/socio" element={<RoleRoute allow="socio" />}>
          <Route element={<SocioLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SocioDashboardPage />} />
            <Route path="mi-cuenta" element={<SocioMiCuentaPage />} />
            <Route path="mis-creditos" element={<SocioMisCreditosPage />} />
          </Route>
        </Route>

      </Route>

      {/* Raíz y cualquier ruta desconocida → redirige según rol o a /login */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
