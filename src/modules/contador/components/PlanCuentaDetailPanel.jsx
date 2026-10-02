import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import { getNivelNombre } from './constants'

/**
 * PlanCuentaDetailPanel — Panel lateral de inspección y operaciones de cuenta contable.
 *
 * @param {{
 *   account: object | null,
 *   loading: boolean,
 *   error: string | null,
 *   onOpenCrearAnalitica: (parentAccount: object) => void,
 *   onOpenEditar: (account: object) => void,
 *   onOpenCambiarEstado: (account: object) => void,
 *   onOpenEliminar: (account: object) => void,
 *   onClose?: () => void,
 * }} props
 */
export default function PlanCuentaDetailPanel({
  account,
  loading,
  error,
  onOpenCrearAnalitica,
  onOpenEditar,
  onOpenCambiarEstado,
  onOpenEliminar,
}) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-card space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-card space-y-3">
        <AlertBanner variant="error">{error}</AlertBanner>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-card text-center text-slate-400 space-y-2">
        <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-1">
          info
        </span>
        <h4 className="font-display font-semibold text-slate-700 text-sm">
          Detalle de Cuenta Contable
        </h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Seleccione una cuenta del árbol jerárquico o use el buscador para examinar su estructura, naturaleza y movimientos.
        </p>
      </div>
    )
  }

  const ancestors =
    account.ancestros || account.ruta_ancestros || account.ruta || []
  const isLevel4Subcuenta = Number(account.nivel) === 4
  const canCreateAnalytic =
    isLevel4Subcuenta && account.es_oficial && account.estado === 'ACTIVA'
  const movimientosCount = Number(account.movimientos ?? 0)

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-white">
        {/* Ancestors Breadcrumbs */}
        {ancestors.length > 0 && (
          <nav
            aria-label="Ruta de jerarquía contable"
            className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 mb-2 font-mono"
          >
            {ancestors.map((anc, idx) => (
              <span key={anc.codigo || idx} className="inline-flex items-center gap-1">
                <span className="hover:text-slate-800 transition" title={anc.nombre}>
                  {anc.codigo}
                </span>
                {idx < ancestors.length - 1 && (
                  <span className="text-slate-300 text-[10px]">/</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#064e3b] tracking-tight block">
              {account.codigo}
            </span>
            <h3 className="font-display text-base font-bold text-slate-900 mt-0.5 leading-snug">
              {account.nombre}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {account.estado === 'ACTIVA' ? (
              <Badge variant="green">Activa</Badge>
            ) : (
              <Badge variant="red">Inactiva</Badge>
            )}
            {account.es_oficial ? (
              <Badge variant="teal">Oficial ASFI</Badge>
            ) : (
              <Badge variant="purple">Analítica</Badge>
            )}
          </div>
        </div>

        {account.descripcion && (
          <p className="mt-2.5 text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed italic">
            "{account.descripcion}"
          </p>
        )}
      </div>

      {/* Grid of properties */}
      <div className="p-5 space-y-3.5 text-xs">
        <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
          Ficha Técnica
        </h4>

        <div className="grid grid-cols-2 gap-3 font-sans">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Nivel Jerárquico:</span>
            <span className="font-semibold text-slate-800">
              Nivel {account.nivel} — {getNivelNombre(account.nivel)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Naturaleza de Saldo:</span>
            <span
              className={`font-semibold ${
                account.naturaleza === 'DEUDORA'
                  ? 'text-teal-700'
                  : 'text-indigo-700'
              }`}
            >
              {account.naturaleza === 'DEUDORA' ? 'Deudora' : 'Acreedora'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Tipo de Registro:</span>
            <span className="font-semibold text-slate-800">
              {account.acepta_movimientos
                ? 'Transaccional (Acepta Movimientos)'
                : 'Agrupadora (Consolidación)'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Cuenta Regularizadora:</span>
            <span className="font-semibold text-slate-800">
              {account.es_regularizadora ? 'Sí (Contra-cuenta)' : 'No'}
            </span>
          </div>
        </div>

        {/* Accounting movements count */}
        <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              receipt_long
            </span>
            <div>
              <span className="font-semibold text-slate-800 block text-xs">
                Movimientos Contables
              </span>
              <span className="text-[11px] text-slate-400 block">
                Asientos registrados en esta cooperativa
              </span>
            </div>
          </div>
          <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
            {movimientosCount}
          </span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-5 space-y-3 bg-slate-50/50">
        <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
          Gestión y Acciones
        </h4>

        {account.es_oficial ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-600 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0 mt-0.5">
                lock
              </span>
              <div>
                <strong className="block text-slate-700">
                  Cuenta Oficial ASFI (Solo lectura)
                </strong>
                <span>
                  Por normativa regulatoria ASFI, el catálogo matriz MCEF es inmutable y no puede modificarse, desactivarse ni eliminarse.
                </span>
              </div>
            </div>

            {canCreateAnalytic && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenCrearAnalitica(account)}
                className="w-full gap-2 !bg-[#064e3b]"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Crear Cuenta Analítica (Nivel 5)</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 mb-2">
              Cuenta analítica propia de la cooperativa. Permite edición, cambio de estado y eliminación controlada.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenEditar(account)}
                className="gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Editar</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenCambiarEstado(account)}
                className="gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {account.estado === 'ACTIVA' ? 'toggle_off' : 'toggle_on'}
                </span>
                <span>{account.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}</span>
              </Button>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => onOpenEliminar(account)}
              className="w-full gap-1.5 !bg-red-600 hover:!bg-red-700"
              disabled={movimientosCount > 0}
              title={
                movimientosCount > 0
                  ? 'No se puede eliminar porque tiene movimientos contables'
                  : 'Eliminar cuenta analítica'
              }
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
              <span>
                {movimientosCount > 0
                  ? 'No eliminable (con movimientos)'
                  : 'Eliminar Cuenta Analítica'}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
