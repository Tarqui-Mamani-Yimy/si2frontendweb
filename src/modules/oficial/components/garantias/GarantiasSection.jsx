import { useState, useEffect } from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'
import CoberturaBar from './CoberturaBar'
import GarantiaFormModal from './GarantiaFormModal'
import VerificarGarantiaModal from './VerificarGarantiaModal'
import {
  listarGarantiasSolicitud,
  getCoberturaSolicitud,
  eliminarGarantia,
} from '../../../../core/api/creditosApi'
import { useAuthStore, selectUser } from '../../../../core/store/authStore'
import { normalizeRole } from '../../../../core/utils/roles'

function formatMoney(value, simbolo = 'Bs.') {
  const n = typeof value === 'number' ? value : parseFloat(value ?? 0)
  const safe = isNaN(n) ? 0 : n
  return `${simbolo} ${safe.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getEstadoBadgeVariant(estado) {
  switch (estado) {
    case 'VERIFICADA':
      return 'green'
    case 'REGISTRADA':
      return 'amber'
    case 'RECHAZADA':
      return 'red'
    case 'LIBERADA':
      return 'teal'
    default:
      return 'slate'
  }
}

function getTipoBadgeVariant(tipo) {
  switch (tipo) {
    case 'HIPOTECARIA':
      return 'navy'
    case 'PRENDARIA':
      return 'indigo'
    case 'PERSONAL':
      return 'green'
    default:
      return 'slate'
  }
}

/**
 * GarantiasSection — Pestaña y panel completo de gestión de garantías para la solicitud (CU-W22).
 * Incluye barra de cobertura, listado, modales de registro/edición y verificación Maker-Checker.
 *
 * @param {{
 *   solicitud: object,
 *   onUpdated?: () => void
 * }} props
 */
export default function GarantiasSection({ solicitud, onUpdated }) {
  const user = useAuthStore(selectUser)
  const roleName = user?.rol?.nombre || ''
  const isAdmin = normalizeRole(roleName) === 'ADMIN' || roleName === 'ADMINISTRADOR'
  const isOficial = normalizeRole(roleName) === 'OFICIAL' || roleName === 'OFICIAL_CREDITO'
  const currentUserId = user?.id

  const [garantias, setGarantias] = useState([])
  const [cobertura, setCobertura] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [garantiaParaEditar, setGarantiaParaEditar] = useState(null)
  const [garantiaParaVerificar, setGarantiaParaVerificar] = useState(null)
  const [garantiaParaEliminar, setGarantiaParaEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const esEditable =
    solicitud?.estado === 'PENDIENTE' || solicitud?.estado === 'OBSERVADA'
  const puedeRegistrar = esEditable && (isAdmin || isOficial)
  const sim = (typeof solicitud?.moneda === 'object' ? solicitud?.moneda?.simbolo : 'Bs.') || 'Bs.'

  async function reloadData() {
    if (!solicitud?.id) return
    try {
      const [list, cob] = await Promise.all([
        listarGarantiasSolicitud(solicitud.id),
        getCoberturaSolicitud(solicitud.id).catch(() => null),
      ])
      setGarantias(Array.isArray(list) ? list : [])
      setCobertura(cob)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar las garantías de la solicitud.')
    }
  }

  useEffect(() => {
    if (!solicitud?.id) return
    let isMounted = true

    Promise.all([
      listarGarantiasSolicitud(solicitud.id),
      getCoberturaSolicitud(solicitud.id).catch(() => null),
    ])
      .then(([list, cob]) => {
        if (!isMounted) return
        setGarantias(Array.isArray(list) ? list : [])
        setCobertura(cob)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Error al cargar las garantías de la solicitud.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [solicitud?.id])

  function handleNuevo() {
    setGarantiaParaEditar(null)
    setFormModalOpen(true)
  }

  function handleEditar(garantia) {
    setGarantiaParaEditar(garantia)
    setFormModalOpen(true)
  }

  async function handleConfirmarEliminar() {
    if (!garantiaParaEliminar) return
    setEliminando(true)
    setError(null)
    try {
      await eliminarGarantia(garantiaParaEliminar.id)
      setSuccessMessage('Garantía eliminada exitosamente.')
      setGarantiaParaEliminar(null)
      await reloadData()
      onUpdated?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la garantía.')
    } finally {
      setEliminando(false)
    }
  }

  function handleFormSuccess() {
    setSuccessMessage(
      garantiaParaEditar
        ? 'Garantía actualizada con éxito.'
        : 'Nueva garantía registrada exitosamente.',
    )
    reloadData()
    onUpdated?.()
  }

  function handleVerificacionSuccess(updated) {
    setSuccessMessage(
      `Garantía #${updated.id} procesada: ${updated.estado}.`,
    )
    reloadData()
    onUpdated?.()
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Notificaciones ── */}
      {successMessage && (
        <AlertBanner
          variant="success"
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        >
          {successMessage}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* ── Barra de Cobertura de Garantías ── */}
      <CoberturaBar cobertura={cobertura} simboloMoneda={sim} />

      {/* ── Encabezado de la Sección de Garantías ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-slate-700">
            account_balance_wallet
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Garantías y Avales Registrados ({garantias.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Bienes hipotecarios, prendarios y garantes fiduciarios asociados a este crédito
            </span>
          </div>
        </div>

        {puedeRegistrar && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleNuevo}
            className="gap-1.5 bg-[#064e3b] text-white hover:bg-[#043327]"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Registrar Garantía</span>
          </Button>
        )}
      </div>

      {/* ── Listado de Garantías ── */}
      {garantias.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
          <span className="material-symbols-outlined text-[36px] text-slate-300 block">
            shield_question
          </span>
          <h4 className="font-semibold text-slate-700 text-xs">
            Sin garantías registradas en el expediente
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {puedeRegistrar
              ? 'Haga clic en "Registrar Garantía" para adjuntar bienes inmuebles, vehículos o garantes personales.'
              : 'Esta solicitud no cuenta con respaldos o garantías fiduciarias registradas.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-2.5 px-3">Tipo / Estado</th>
                <th className="py-2.5 px-3">Descripción y Respaldo</th>
                <th className="py-2.5 px-3 text-right">Val. Comercial</th>
                <th className="py-2.5 px-3 text-right">Val. Realizable</th>
                <th className="py-2.5 px-3">Control y Fechas</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {garantias.map((g) => {
                const gSim =
                  (typeof g.moneda === 'object' ? g.moneda?.simbolo : sim) || sim
                const esRegistrada = g.estado === 'REGISTRADA'
                const esCreadaPorMi =
                  currentUserId != null &&
                  g.usuario_registro?.id != null &&
                  Number(currentUserId) === Number(g.usuario_registro.id)

                return (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Tipo y Estado */}
                    <td className="py-3 px-3 space-y-1 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getTipoBadgeVariant(g.tipo)}>
                          {g.tipo}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={getEstadoBadgeVariant(g.estado)}>
                          {g.estado}
                        </Badge>
                      </div>
                    </td>

                    {/* Descripción y Respaldo / Aval */}
                    <td className="py-3 px-3 align-top max-w-xs">
                      <p className="font-semibold text-slate-900 leading-snug">
                        {g.descripcion}
                      </p>

                      {g.tipo === 'PERSONAL' && g.avalista && (
                        <div className="mt-1 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[10px] space-y-0.5 text-emerald-950">
                          <div className="font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-emerald-700">
                              person
                            </span>
                            <span>{g.avalista.nombre}</span>
                            <span className="text-emerald-700 font-mono">
                              (CI: {g.avalista.ci})
                            </span>
                          </div>
                          <div>
                            Relación: <strong>{g.avalista.relacion}</strong>
                            {g.avalista.telefono && ` • Tel: ${g.avalista.telefono}`}
                            {g.avalista.socio_id && ` • Socio #${g.avalista.socio_id}`}
                          </div>
                          <div className="font-mono text-emerald-800">
                            Ingreso: {formatMoney(g.avalista.ingreso_mensual, gSim)}/mes
                          </div>
                        </div>
                      )}

                      {g.documento_referencia && (
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          Ref: {g.documento_referencia}
                        </span>
                      )}

                      {/* Observación de verificación si no está REGISTRADA */}
                      {g.observacion_verificacion && (
                        <div className={`mt-1.5 p-1.5 rounded text-[10px] italic border ${
                          g.estado === 'VERIFICADA'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border-rose-200'
                        }`}>
                          <span className="font-bold block not-italic">Dictamen de Verificación:</span>
                          &ldquo;{g.observacion_verificacion}&rdquo;
                        </div>
                      )}
                    </td>

                    {/* Valor Comercial */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700 align-top whitespace-nowrap">
                      {g.valor_comercial != null ? (
                        formatMoney(g.valor_comercial, gSim)
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">N/A (Personal)</span>
                      )}
                    </td>

                    {/* Valor Realizable */}
                    <td className="py-3 px-3 text-right font-mono font-bold align-top whitespace-nowrap">
                      <span className={esRegistrada ? 'text-amber-800' : 'text-emerald-900'}>
                        {formatMoney(g.valor_realizable, gSim)}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-sans font-normal">
                        {esRegistrada ? 'Pendiente' : 'Computado'}
                      </span>
                    </td>

                    {/* Control y Fechas */}
                    <td className="py-3 px-3 text-[10px] text-slate-500 align-top whitespace-nowrap">
                      <div>
                        Reg: <strong className="text-slate-700">{g.usuario_registro?.nombre || 'Personal'}</strong>
                      </div>
                      <div className="font-mono">{formatDate(g.fecha_registro)}</div>
                      {g.usuario_verificacion && (
                        <div className="mt-1 pt-1 border-t border-slate-100">
                          Verif: <strong className="text-slate-700">{g.usuario_verificacion.nombre}</strong>
                          <div className="font-mono">{formatDate(g.fecha_verificacion)}</div>
                        </div>
                      )}
                      {g.fecha_liberacion && (
                        <div className="mt-1 text-teal-800 font-semibold font-mono">
                          Liberada: {formatDate(g.fecha_liberacion)}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        {/* Botón Verificar Maker-Checker para Admin */}
                        {isAdmin && esRegistrada && !esCreadaPorMi && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => setGarantiaParaVerificar(g)}
                            className="!py-0.5 !px-2 !text-[10px] gap-1 bg-[#064e3b] text-white hover:bg-[#043327]"
                            title="Verificar o rechazar esta garantía (Maker-Checker)"
                          >
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            <span>Verificar</span>
                          </Button>
                        )}

                        {isAdmin && esRegistrada && esCreadaPorMi && (
                          <span
                            className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold"
                            title="Usted registró esta garantía. Otro administrador debe verificarla por normativa Maker-Checker."
                          >
                            Maker-Checker
                          </span>
                        )}

                        {/* Botones Editar y Eliminar (solo en REGISTRADA y solicitud editable) */}
                        {esRegistrada && esEditable && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditar(g)}
                              className="!py-0.5 !px-1.5 !text-[10px]"
                              title="Editar garantía"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setGarantiaParaEliminar(g)}
                              className="!py-0.5 !px-1.5 !text-[10px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 hover:border-rose-300"
                              title="Eliminar garantía"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                            </Button>
                          </div>
                        )}

                        {!esRegistrada && (
                          <span className="text-[10px] text-slate-400 italic">
                            Inmutable
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Formulario (Crear / Editar) ── */}
      {formModalOpen && (
        <GarantiaFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setGarantiaParaEditar(null)
          }}
          solicitud={solicitud}
          garantia={garantiaParaEditar}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* ── Modal Verificación Maker-Checker ── */}
      {garantiaParaVerificar && (
        <VerificarGarantiaModal
          open={Boolean(garantiaParaVerificar)}
          onClose={() => setGarantiaParaVerificar(null)}
          garantia={garantiaParaVerificar}
          onSuccess={handleVerificacionSuccess}
        />
      )}

      {/* ── Modal Confirmación de Eliminación ── */}
      {garantiaParaEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h4 className="font-bold text-sm text-slate-900">
                ¿Eliminar esta garantía?
              </h4>
            </div>

            <p className="text-xs text-slate-600">
              Se eliminará permanentemente la garantía #{garantiaParaEliminar.id} ({garantiaParaEliminar.tipo}) del expediente crediticio. Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setGarantiaParaEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={eliminando}
                onClick={handleConfirmarEliminar}
                className="gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Confirmar Eliminación</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
