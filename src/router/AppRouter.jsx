import { Navigate, Route, Routes } from 'react-router-dom'
import {
  FeatureRoute,
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
import SuperAdminBackupsPage from '../modules/superadmin/pages/BackupsPage'

// ── Landing Pública ───────────────────────────────────────────
import LandingPage from '../modules/landing/pages/LandingPage'
import { selectIsAuthenticated, useAuthStore } from '../core/store/authStore'

// ── Admin ─────────────────────────────────────────────────────
import AdminBitacoraPage from '../modules/admin/pages/BitacoraPage'
import AdminCajaPage from '../modules/admin/pages/CajaPage'
import AdminConfiguracionPage from '../modules/admin/pages/ConfiguracionPage'
import AdminCreditosPage from '../modules/admin/pages/CreditosPage'
import AdminDashboardPage from '../modules/admin/pages/DashboardPage'
import AdminReportesPage from '../modules/admin/pages/ReportesPage'
import AdminInformesAsfiPage from '../modules/admin/pages/InformesAsfiPage'
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
import OficialSolicitudesPage from '../modules/oficial/pages/SolicitudesPage'
import CarteraPage from '../modules/oficial/pages/CarteraPage'
import RecreditosPage from '../modules/oficial/pages/RecreditosPage'
import ComitePage from '../modules/oficial/pages/ComitePage'
import AlertasPage from '../modules/oficial/pages/AlertasPage'

// ── Contador ──────────────────────────────────────────────────
import ContadorCumplimientoPage from '../modules/contador/pages/CumplimientoPage'
import ContadorDashboardPage from '../modules/contador/pages/DashboardPage'
import ContadorReportesPage from '../modules/contador/pages/ReportesPage'
import GestionarNotificacionesPage from '../modules/notificaciones/pages/GestionarNotificacionesPage'
import MisNotificacionesPage from '../modules/notificaciones/pages/MisNotificacionesPage'
import ContadorInformesAsfiPage from '../modules/contador/pages/InformesAsfiPage'
import PlanCuentasPage from '../modules/contador/pages/PlanCuentasPage'
import ComprobantesPage from '../modules/contador/pages/ComprobantesPage'
import ParametrosContablesPage from '../modules/contador/pages/ParametrosContablesPage'
import LibroDiarioPage from '../modules/contador/pages/LibroDiarioPage'
import LibroMayorPage from '../modules/contador/pages/LibroMayorPage'
import BalanceComprobacionPage from '../modules/contador/pages/BalanceComprobacionPage'
import TiposCambioPage from '../modules/contador/pages/TiposCambioPage'
import BalanceGeneralPage from '../modules/contador/pages/BalanceGeneralPage'
import EstadoResultadosPage from '../modules/contador/pages/EstadoResultadosPage'

// ── Socio ─────────────────────────────────────────────────────
import SocioDashboardPage from '../modules/socio/pages/DashboardPage'
import SocioMiCuentaPage from '../modules/socio/pages/MiCuentaPage'
import SocioMisCreditosPage from '../modules/socio/pages/MisCreditosPage'

// ── Shared / DPF ──────────────────────────────────────────────
import PlazoFijoPage from '../shared/components/dpf/PlazoFijoPage'

function RootRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (isAuthenticated) {
    return <RootRedirect />
  }
  return <LandingPage />
}

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
            <Route path="backups" element={<SuperAdminBackupsPage />} />
          </Route>
        </Route>

        {/* ADMINISTRADOR — acceso total dentro de su cooperativa */}
        <Route path="/admin" element={<RoleRoute allow="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route
              path="bitacora"
              element={
                <FeatureRoute modulo="respaldos_bitacora">
                  <AdminBitacoraPage />
                </FeatureRoute>
              }
            />
            <Route path="usuarios/nuevo" element={<RegistrarUsuarioPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="socios" element={<AdminSociosPage />} />
            <Route path="socios/nuevo" element={<RegistrarSocioPage />} />
            <Route path="solicitudes" element={<OficialSolicitudesPage />} />
            <Route path="cartera" element={<CarteraPage />} />
            <Route path="alertas" element={<AlertasPage />} />
            <Route
              path="recreditos"
              element={
                <FeatureRoute modulo="recredito_ia">
                  <RecreditosPage />
                </FeatureRoute>
              }
            />
            <Route path="comite" element={<ComitePage />} />
            <Route path="creditos" element={<AdminCreditosPage />} />
            <Route path="caja" element={<AdminCajaPage />} />
            <Route path="plan-cuentas" element={<PlanCuentasPage />} />
            <Route path="comprobantes" element={<ComprobantesPage />} />
            <Route path="libro-diario" element={<LibroDiarioPage />} />
            <Route path="libro-mayor" element={<LibroMayorPage />} />
            <Route path="balance-comprobacion" element={<BalanceComprobacionPage />} />
            <Route path="balance-general" element={<BalanceGeneralPage />} />
            <Route path="estado-resultados" element={<EstadoResultadosPage />} />
            <Route path="tipos-cambio" element={<TiposCambioPage />} />
            <Route path="parametros-contables" element={<ParametrosContablesPage />} />
            <Route path="reportes" element={<AdminReportesPage />} />
            <Route
              path="notificaciones"
              element={
                <FeatureRoute modulo="notificaciones_socios">
                  <GestionarNotificacionesPage />
                </FeatureRoute>
              }
            />
            <Route
              path="informes-asfi"
              element={
                <FeatureRoute modulo="informes_asfi">
                  <AdminInformesAsfiPage />
                </FeatureRoute>
              }
            />
            <Route path="configuracion" element={<AdminConfiguracionPage />} />
          </Route>
        </Route>

        {/* CAJERO / VENTANILLA */}
        <Route path="/cajero" element={<RoleRoute allow="cajero" />}>
          <Route element={<CajeroLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CajeroDashboardPage />} />
            <Route path="caja" element={<CajeroCajaPage />} />
            <Route path="cartera" element={<CarteraPage />} />
            <Route path="plazo-fijo" element={<PlazoFijoPage />} />
            <Route path="socios" element={<CajeroSociosPage />} />
            <Route
              path="notificaciones"
              element={
                <FeatureRoute modulo="notificaciones_socios">
                  <GestionarNotificacionesPage />
                </FeatureRoute>
              }
            />
          </Route>
        </Route>

        {/* OFICIAL DE CRÉDITO / CAMPO */}
        <Route path="/oficial" element={<RoleRoute allow="oficial" />}>
          <Route element={<OficialLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OficialDashboardPage />} />
            <Route path="solicitudes" element={<OficialSolicitudesPage />} />
            <Route path="cartera" element={<CarteraPage />} />
            <Route path="alertas" element={<AlertasPage />} />
            <Route
              path="recreditos"
              element={
                <FeatureRoute modulo="recredito_ia">
                  <RecreditosPage />
                </FeatureRoute>
              }
            />
            <Route path="comite" element={<ComitePage />} />
            <Route path="plazo-fijo" element={<PlazoFijoPage />} />
            <Route path="creditos" element={<OficialCreditosPage />} />
            <Route path="socios" element={<OficialSociosPage />} />
          </Route>
        </Route>

        {/* CONTADOR / CUMPLIMIENTO */}
        <Route path="/contador" element={<RoleRoute allow="contador" />}>
          <Route element={<ContadorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ContadorDashboardPage />} />
            <Route path="plan-cuentas" element={<PlanCuentasPage />} />
            <Route path="comprobantes" element={<ComprobantesPage />} />
            <Route path="libro-diario" element={<LibroDiarioPage />} />
            <Route path="libro-mayor" element={<LibroMayorPage />} />
            <Route path="balance-comprobacion" element={<BalanceComprobacionPage />} />
            <Route path="balance-general" element={<BalanceGeneralPage />} />
            <Route path="estado-resultados" element={<EstadoResultadosPage />} />
            <Route path="tipos-cambio" element={<TiposCambioPage />} />
            <Route path="parametros-contables" element={<ParametrosContablesPage />} />
            <Route path="comite" element={<ComitePage />} />
            <Route path="reportes" element={<ContadorReportesPage />} />
            <Route
              path="informes-asfi"
              element={
                <FeatureRoute modulo="informes_asfi">
                  <ContadorInformesAsfiPage />
                </FeatureRoute>
              }
            />
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
          <Route element={<FeatureRoute modulo="banca_movil" />}>
            <Route element={<SocioLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SocioDashboardPage />} />
              <Route path="mi-cuenta" element={<SocioMiCuentaPage />} />
              <Route path="mis-creditos" element={<SocioMisCreditosPage />} />
              <Route
                path="notificaciones"
                element={
                  <FeatureRoute modulo="notificaciones_socios">
                    <MisNotificacionesPage />
                  </FeatureRoute>
                }
              />
            </Route>
          </Route>
        </Route>

      </Route>

      {/* Raíz pública (Landing) para no autenticados, dashboard para autenticados */}
      <Route path="/" element={<RootRoute />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
