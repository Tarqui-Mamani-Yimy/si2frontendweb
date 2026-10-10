import { useState, useEffect } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import EditarParametroModal from '../components/EditarParametroModal'
import { getParametrosContables } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function ParametrosContablesPage() {
  const [parametros, setParametros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedParametro, setSelectedParametro] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    getParametrosContables()
      .then((data) => {
        if (!isMounted) return
        setError(null)
        const list = Array.isArray(data) ? data : data?.items || []
        setParametros(list)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar la tabla de parámetros contables.',
          ),
        )
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  function handleOpenEdit(param) {
    setSelectedParametro(param)
    setModalOpen(true)
  }

  function handleEditSuccess(updated) {
    setFeedback({
      variant: 'success',
      message: `Mapeo del parámetro ${updated?.clave || selectedParametro?.clave} actualizado con éxito.`,
    })
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Parámetros Contables"
        subtitle="Mapeo de cuentas del catálogo MCEF a operaciones del core financiero (CU-W30)."
      />

      {feedback && (
        <AlertBanner
          variant={feedback.variant}
          dismissible
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </AlertBanner>
      )}

      {error && (
        <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Explicación normativa */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="material-symbols-outlined text-[17px] text-[#064e3b]">
            rule
          </span>
          <span>Reglas de Imputación de Parámetros Operativos</span>
        </div>
        <p>
          Los parámetros contables definen qué cuentas del Plan de Cuentas recibirán los cargos y abonos automáticos originados por transacciones de socios en ventanilla, cartera crediticia y depósitos a plazo fijo.
        </p>
        <p className="text-[11px] text-slate-500">
          <strong>Restricción:</strong> Si la cooperativa ha creado cuentas analíticas bajo la subcuenta asociada, el parámetro debe apuntar obligatoriamente a una cuenta analítica de nivel 5.
        </p>
      </div>

      {/* Tabla de Parámetros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : parametros.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-1">
              tune
            </span>
            <p className="text-sm font-semibold text-slate-700">
              No se registran parámetros contables
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Los parámetros serán inicializados automáticamente por el sistema al crearse la cooperativa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-48">Clave de Parámetro</th>
                  <th className="py-3 px-4 min-w-[240px]">Cuenta Contable Imputable</th>
                  <th className="py-3 px-3 text-center">Naturaleza</th>
                  <th className="py-3 px-3 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {parametros.map((p) => {
                  const cuenta = p.plan_cuenta || {}
                  return (
                    <tr key={p.clave || p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {p.clave}
                        </span>
                        {p.descripcion && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {p.descripcion}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {cuenta.codigo ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-[#064e3b]">
                              {cuenta.codigo}
                            </span>
                            <span className="text-slate-800 font-medium block">
                              {cuenta.nombre}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Sin cuenta asignada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {cuenta.naturaleza ? (
                          <Badge
                            variant={cuenta.naturaleza === 'DEUDORA' ? 'teal' : 'navy'}
                            className="!text-[9px] !py-0 !px-1.5"
                          >
                            {cuenta.naturaleza === 'DEUDORA' ? 'Deudora' : 'Acreedora'}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {cuenta.es_oficial != null ? (
                          cuenta.es_oficial ? (
                            <Badge variant="slate" className="!text-[9px] !py-0 !px-1.5">
                              ASFI
                            </Badge>
                          ) : (
                            <Badge variant="purple" className="!text-[9px] !py-0 !px-1.5">
                              Analítica
                            </Badge>
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            edit
                          </span>
                          <span>Editar</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditarParametroModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedParametro(null)
        }}
        parametro={selectedParametro}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
