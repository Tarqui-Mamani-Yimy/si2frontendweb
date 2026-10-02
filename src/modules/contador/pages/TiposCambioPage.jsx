import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import Modal from '../../../components/ui/Modal'
import { FormField, Input } from '../../../components/ui/FormField'
import {
  formatDate,
  getTodayIso,
  getFirstDayOfYearIso,
  formatExchangeRate,
} from '../components/contabilidadUtils'
import {
  getTiposCambio,
  createTipoCambio,
  updateTipoCambio,
} from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

export default function TiposCambioPage() {
  const [desde, setDesde] = useState(getFirstDayOfYearIso())
  const [hasta, setHasta] = useState(getTodayIso())
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modales
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false)
  const [rateToEdit, setRateToEdit] = useState(null)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)

  // Guard contra condiciones de carrera
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    const params = {
      moneda_id: 2, // USD
    }
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta

    getTiposCambio(params)
      .then((data) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(null)
        setRates(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar el historial de tipos de cambio.',
          ),
        )
      })
      .finally(() => {
        if (isMounted && reqId === requestIdRef.current) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [desde, hasta, refreshTrigger])

  function handleFilterSubmit(e) {
    e?.preventDefault()
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleResetFilters() {
    setDesde(getFirstDayOfYearIso())
    setHasta(getTodayIso())
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleOpenEdit(rate) {
    setRateToEdit(rate)
    setModalEditarOpen(true)
  }

  function handleCreateSuccess(created) {
    setFeedback({
      variant: 'success',
      message: `Tipo de cambio para el ${formatDate(created?.fecha)} registrado con éxito (${formatExchangeRate(created?.valor)} Bs/USD).`,
    })
    setModalRegistrarOpen(false)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  function handleEditSuccess(updated) {
    setFeedback({
      variant: 'success',
      message: `Tipo de cambio para el ${formatDate(updated?.fecha || rateToEdit?.fecha)} corregido con éxito (${formatExchangeRate(updated?.valor)} Bs/USD).`,
    })
    setModalEditarOpen(false)
    setRateToEdit(null)
    setLoading(true)
    setRefreshTrigger((k) => k + 1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <PageHeader
        title="Tipos de Cambio Oficiales"
        subtitle="Cotización diaria de monedas extranjeras para valuación de estados financieros (CU-W32)."
        action={
          <Button
            type="button"
            variant="primary"
            className="!bg-[#064e3b] gap-1.5"
            onClick={() => setModalRegistrarOpen(true)}
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>Registrar Tipo de Cambio</span>
          </Button>
        }
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

      {/* Nota normativa ASFI */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="material-symbols-outlined text-[18px] text-[#064e3b]">
            currency_exchange
          </span>
          <span>Normativa de Conversión de Moneda Extranjera</span>
        </div>
        <p>
          Las entidades financieras en Bolivia presentan sus estados financieros en moneda nacional. Los saldos en moneda extranjera (USD) se valúan al tipo de cambio oficial vigente a la fecha de corte emitido por el Banco Central de Bolivia (BCB).
        </p>
        <p className="text-[11px] text-slate-500">
          <strong>Regla:</strong> Si una fecha de corte no tiene cotización específica, el sistema utiliza la cotización inmediata anterior registrada.
        </p>
      </div>

      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          {/* Desde */}
          <div>
            <label htmlFor="tc_desde" className="font-semibold text-slate-700 block mb-1">
              Fecha Desde:
            </label>
            <input
              id="tc_desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Hasta */}
          <div>
            <label htmlFor="tc_hasta" className="font-semibold text-slate-700 block mb-1">
              Fecha Hasta:
            </label>
            <input
              id="tc_hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#006c49]"
            />
          </div>

          {/* Moneda Fija */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Moneda Extranjera:
            </label>
            <div className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-slate-600 font-medium">
              Dólares Americanos (USD)
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              className="!bg-[#064e3b] gap-1 h-8 flex-1"
            >
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <span>Filtrar</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-slate-500"
            >
              Restablecer
            </Button>
          </div>
        </div>
      </form>

      {/* Tabla de Tipos de Cambio */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-1">
              payments
            </span>
            <p className="text-sm font-semibold text-slate-700">
              No existen tipos de cambio registrados en este rango de fechas
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Utilice el botón "Registrar Tipo de Cambio" para ingresar la cotización oficial de una fecha requerida.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Fecha de Vigencia</th>
                  <th className="py-2.5 px-3">Moneda</th>
                  <th className="py-2.5 px-4 text-right">Cotización Oficial (Bs/USD)</th>
                  <th className="py-2.5 px-3">Fuente</th>
                  <th className="py-2.5 px-3">Fecha de Registro</th>
                  <th className="py-2.5 px-3">Registrado por</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {rates.map((r) => (
                  <tr key={r.id || r.fecha} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {formatDate(r.fecha)}
                    </td>

                    <td className="py-2.5 px-3">
                      <Badge variant="navy">{r.moneda}</Badge>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#064e3b] text-sm">
                      {formatExchangeRate(r.valor)}
                    </td>

                    <td className="py-2.5 px-3">
                      <Badge variant="teal">{r.fuente || 'BCB'}</Badge>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {formatDate(r.fecha_registro) || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">
                      {r.usuario_id ? `#${r.usuario_id}` : '—'}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(r)}
                          className="!p-1.5 text-slate-600 hover:text-slate-900"
                          title="Corregir cotización"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Tipo de Cambio */}
      {modalRegistrarOpen && (
        <RegistrarTipoCambioModal
          open={modalRegistrarOpen}
          onClose={() => setModalRegistrarOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Modal Corregir Tipo de Cambio */}
      {modalEditarOpen && rateToEdit && (
        <EditarTipoCambioModal
          open={modalEditarOpen}
          rate={rateToEdit}
          onClose={() => {
            setModalEditarOpen(false)
            setRateToEdit(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

function RegistrarTipoCambioModal({ open, onClose, onSuccess }) {
  const today = getTodayIso()
  const [fecha, setFecha] = useState(today)
  const [valor, setValor] = useState('6.86000')
  const [fuente, setFuente] = useState('BCB')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!fecha) {
      setError('La fecha de vigencia es obligatoria.')
      return
    }
    if (fecha > today) {
      setError('No se pueden registrar tipos de cambio con fechas futuras.')
      return
    }

    const numValor = parseFloat(String(valor).replace(',', '.'))
    if (isNaN(numValor) || numValor <= 0) {
      setError('El valor del tipo de cambio debe ser un número positivo mayor a 0.')
      return
    }

    setLoading(true)

    createTipoCambio({
      moneda_id: 2, // USD
      fecha,
      valor: String(valor).trim(),
      fuente: fuente.trim() || 'BCB',
    })
      .then((created) => {
        onSuccess(created)
      })
      .catch((err) => {
        if (err.response?.status === 409) {
          setError(
            'Ya existe un tipo de cambio registrado para esta fecha. Use la opción de corregir en la tabla.',
          )
        } else {
          setError(
            getApiErrorMessage(
              err,
              'Error al registrar el tipo de cambio oficial.',
            ),
          )
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Tipo de Cambio Oficial"
      subtitle="Cotización oficial de Dólares Americanos (USD) respecto al Boliviano (BOB)"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form_registrar_tc"
            variant="primary"
            size="sm"
            loading={loading}
            className="!bg-[#064e3b]"
          >
            Guardar Cotización
          </Button>
        </div>
      }
    >
      <form id="form_registrar_tc" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <FormField label="Moneda Extranjera">
          <Input value="Dólares Americanos (USD)" disabled readOnly className="bg-slate-100 text-slate-500 font-medium" />
        </FormField>

        <FormField label="Fecha de Vigencia" required>
          <Input
            type="date"
            max={today}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="font-mono"
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            No se permiten fechas futuras a la fecha actual ({formatDate(today)}).
          </span>
        </FormField>

        <FormField label="Valor de Cotización (Bs por 1 USD)" required>
          <Input
            type="number"
            step="0.00001"
            min="0.00001"
            placeholder="6.86000"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            className="font-mono font-bold text-[#064e3b]"
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Precisión requerida: hasta 5 decimales (ej. 6.86000 o 6.96000).
          </span>
        </FormField>

        <FormField label="Fuente Oficial de Información">
          <Input
            type="text"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            placeholder="BCB"
            maxLength={30}
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Por defecto: Banco Central de Bolivia (BCB).
          </span>
        </FormField>
      </form>
    </Modal>
  )
}

function EditarTipoCambioModal({ open, rate, onClose, onSuccess }) {
  const [valor, setValor] = useState(rate?.valor ? String(rate.valor) : '')
  const [fuente, setFuente] = useState(rate?.fuente || 'BCB')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const numValor = parseFloat(String(valor).replace(',', '.'))
    if (isNaN(numValor) || numValor <= 0) {
      setError('El valor del tipo de cambio debe ser un número positivo mayor a 0.')
      return
    }

    setLoading(true)

    updateTipoCambio(rate.id, {
      valor: String(valor).trim(),
      fuente: fuente.trim() || 'BCB',
    })
      .then((updated) => {
        onSuccess(updated)
      })
      .catch((err) => {
        setError(
          getApiErrorMessage(
            err,
            'Error al corregir el tipo de cambio.',
          ),
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Corregir Tipo de Cambio"
      subtitle={`Fecha de vigencia: ${formatDate(rate?.fecha)}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form_editar_tc"
            variant="primary"
            size="sm"
            loading={loading}
            className="!bg-[#064e3b]"
          >
            Guardar Corrección
          </Button>
        </div>
      }
    >
      <form id="form_editar_tc" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <FormField label="Fecha (no modificable)">
          <Input
            value={formatDate(rate?.fecha)}
            disabled
            readOnly
            className="bg-slate-100 text-slate-600 font-mono"
          />
        </FormField>

        <FormField label="Valor Corregido (Bs por 1 USD)" required>
          <Input
            type="number"
            step="0.00001"
            min="0.00001"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            autoFocus
            className="font-mono font-bold text-[#064e3b]"
          />
        </FormField>

        <FormField label="Fuente Oficial de Información">
          <Input
            type="text"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            maxLength={30}
          />
        </FormField>
      </form>
    </Modal>
  )
}
