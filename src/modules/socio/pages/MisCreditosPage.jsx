import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import AlertBanner from '../../../components/ui/AlertBanner'
import MetricCard from '../../../components/ui/MetricCard'
import { getApiErrorMessage } from '../../../core/api/errors'
import {
  formatTipoAmortizacion,
  formatTipoCredito,
  getExtractoCredito,
  exportExtractoCredito,
  getMisCreditos,
} from '../../../core/api/socioApi'
import { triggerCsvDownload } from '../../contador/components/contabilidadUtils'

function formatMoney(amount, currency = 'Bs.') {
  const n = Number(amount ?? 0)
  return `${currency} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoString
  }
}

export default function MisCreditosPage() {
  const { id: urlCreditId } = useParams()
  const navigate = useNavigate()

  const [creditos, setCreditos] = useState([])
  const [loadingCreditos, setLoadingCreditos] = useState(true)
  const [creditosError, setCreditosError] = useState(null)

  // Selected credit for extracto
  const [selectedCreditoId, setSelectedCreditoId] = useState(urlCreditId ? Number(urlCreditId) : null)
  const [extracto, setExtracto] = useState(null)
  const [loadingExtracto, setLoadingExtracto] = useState(false)
  const [extractoError, setExtractoError] = useState(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [downloading, setDownloading] = useState(false)

  const loadCreditos = useCallback(async () => {
    setLoadingCreditos(true)
    setCreditosError(null)
    try {
      const data = await getMisCreditos()
      setCreditos(Array.isArray(data) ? data : [])
    } catch (err) {
      setCreditosError(
        getApiErrorMessage(err, 'No se pudieron cargar tus créditos.'),
      )
    } finally {
      setLoadingCreditos(false)
    }
  }, [])

  useEffect(() => {
    loadCreditos()
  }, [loadCreditos])

  useEffect(() => {
    if (urlCreditId) {
      setSelectedCreditoId(Number(urlCreditId))
    }
  }, [urlCreditId])

  const loadExtracto = useCallback(async (creditoId, fDesde, fHasta) => {
    if (!creditoId) return
    setLoadingExtracto(true)
    setExtractoError(null)
    try {
      const data = await getExtractoCredito(creditoId, {
        desde: fDesde || undefined,
        hasta: fHasta || undefined,
      })
      setExtracto(data)
      if (data?.desde && !fDesde) setDesde(data.desde)
      if (data?.hasta && !fHasta) setHasta(data.hasta)
    } catch (err) {
      setExtractoError(
        getApiErrorMessage(err, 'No se pudo cargar el extracto de pagos.'),
      )
    } finally {
      setLoadingExtracto(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCreditoId) {
      loadExtracto(selectedCreditoId, desde, hasta)
    }
  }, [selectedCreditoId, loadExtracto])

  function handleSelectCredito(creditoId) {
    setSelectedCreditoId(creditoId)
    setDesde('')
    setHasta('')
  }

  function handleBackToList() {
    setSelectedCreditoId(null)
    setExtracto(null)
    navigate('/socio/mis-creditos')
  }

  function handleFilterExtracto(e) {
    e.preventDefault()
    if (selectedCreditoId) {
      loadExtracto(selectedCreditoId, desde, hasta)
    }
  }

  async function handleDownloadExport(formato) {
    if (!selectedCreditoId) return
    setDownloading(true)
    try {
      const res = await exportExtractoCredito(selectedCreditoId, {
        formato,
        desde: desde || undefined,
        hasta: hasta || undefined,
      })
      const defaultFilename = `extracto-credito-${selectedCreditoId}.${formato}`
      triggerCsvDownload(
        res.data,
        defaultFilename,
        res.headers?.['content-disposition'],
      )
    } catch (err) {
      setExtractoError(
        getApiErrorMessage(err, `Error al descargar el extracto en ${formato.toUpperCase()}.`),
      )
    } finally {
      setDownloading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA: EXTRACTO DE PAGOS DEL CRÉDITO SELECCIONADO
  // ─────────────────────────────────────────────────────────────
  if (selectedCreditoId && (extracto || loadingExtracto)) {
    const credInfo = extracto?.credito
    const totales = extracto?.totales
    const resumen = extracto?.resumen
    const pagos = extracto?.pagos || []
    const cuotas = extracto?.cuotas || []
    const curSim = credInfo?.moneda === 'USD' ? '$' : 'Bs.'

    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver a mis créditos</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={downloading}
              onClick={() => handleDownloadExport('pdf')}
              className="gap-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
              <span>Descargar PDF</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={downloading}
              onClick={() => handleDownloadExport('csv')}
              className="gap-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>Descargar CSV</span>
            </Button>
          </div>
        </div>

        <PageHeader
          title={`Extracto de Pagos — ${credInfo?.numero_credito || `Crédito #${selectedCreditoId}`}`}
          subtitle="Historial detallado de amortizaciones, cuotas y seguro de desgravamen."
        />

        {extractoError && (
          <AlertBanner variant="error" dismissible onDismiss={() => setExtractoError(null)}>
            {extractoError}
          </AlertBanner>
        )}

        {loadingExtracto && !extracto ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <span className="material-symbols-outlined text-3xl animate-spin mb-2 block">
              progress_activity
            </span>
            Cargando extracto de pagos...
          </div>
        ) : (
          <>
            {/* Header con datos del crédito (S3, S4) */}
            <Card className="p-5 sm:p-6 space-y-4 border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Información del Crédito
                  </span>
                  <h2 className="text-lg font-bold text-[#0b1c30]">
                    {credInfo?.producto || 'Crédito'}
                  </h2>
                </div>
                <Badge variant={credInfo?.estado === 'VIGENTE' ? 'green' : 'slate'}>
                  {credInfo?.estado}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Tipo de crédito (ASFI)
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatTipoCredito(credInfo?.tipo_credito)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Sistema de amortización
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatTipoAmortizacion(credInfo?.tipo_amortizacion)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Monto desembolsado
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {formatMoney(credInfo?.monto_desembolsado, curSim)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Saldo pendiente
                  </span>
                  <span className="font-bold text-[#006c49] font-mono text-sm">
                    {formatMoney(credInfo?.saldo_pendiente, curSim)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Tasa de interés anual
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {credInfo?.tasa_interes_anual ? `${credInfo.tasa_interes_anual}%` : '—'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Tasa seguro desgravamen
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {credInfo?.tasa_seguro_desgravamen ? `${credInfo.tasa_seguro_desgravamen}%` : '—'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Plazo
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {credInfo?.plazo_meses ? `${credInfo.plazo_meses} meses` : '—'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Fecha de desembolso
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {formatDate(credInfo?.fecha_desembolso)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Filtro por rango de fechas */}
            <Card className="p-4">
              <form onSubmit={handleFilterExtracto} className="flex flex-wrap items-end gap-3 text-xs">
                <div>
                  <label htmlFor="f-desde" className="block font-semibold text-slate-600 mb-1">
                    Desde:
                  </label>
                  <input
                    id="f-desde"
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#006c49]"
                  />
                </div>

                <div>
                  <label htmlFor="f-hasta" className="block font-semibold text-slate-600 mb-1">
                    Hasta:
                  </label>
                  <input
                    id="f-hasta"
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-[#006c49]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loadingExtracto}
                  className="!bg-[#064e3b] h-8 gap-1 px-3"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                  <span>Filtrar período</span>
                </Button>
              </form>
            </Card>

            {/* Resumen de cuotas y seguro (S3) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                compact
                label="Cuotas pagadas"
                value={`${resumen?.cuotas_pagadas ?? 0} / ${resumen?.cuotas_total ?? 0}`}
                subtitle="Amortizaciones realizadas"
                icon="check_circle"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-700"
              />
              <MetricCard
                compact
                label="Cuotas vencidas"
                value={resumen?.cuotas_vencidas ?? 0}
                subtitle="Cuotas en atraso"
                icon="warning"
                iconBg={resumen?.cuotas_vencidas > 0 ? 'bg-rose-50' : 'bg-slate-50'}
                iconColor={resumen?.cuotas_vencidas > 0 ? 'text-rose-600' : 'text-slate-400'}
              />
              <MetricCard
                compact
                label="Cuotas pendientes"
                value={resumen?.cuotas_pendientes ?? 0}
                subtitle="Restantes por pagar"
                icon="schedule"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
              <MetricCard
                compact
                label="Seguro programado"
                value={formatMoney(resumen?.seguro_programado, curSim)}
                subtitle="Total seguro desgravamen"
                icon="shield"
                iconBg="bg-teal-50"
                iconColor="text-teal-700"
              />
            </div>

            {/* Tabla de Pagos Realizados en el Período */}
            <Card className="p-5 space-y-4 border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0b1c30]">
                    Pagos y Amortizaciones Realizadas
                  </h3>
                  <p className="text-xs text-slate-400">
                    {pagos.length} {pagos.length === 1 ? 'pago registrado' : 'pagos registrados'} en el período
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400">payments</span>
              </div>

              {pagos.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No se registraron pagos en el rango de fechas seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#f8f9ff] text-slate-500 font-semibold uppercase text-[11px]">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Recibo</th>
                        <th className="py-2.5 px-3">Cuota</th>
                        <th className="py-2.5 px-3 text-right">Capital</th>
                        <th className="py-2.5 px-3 text-right">Interés</th>
                        <th className="py-2.5 px-3 text-right">Seguro</th>
                        <th className="py-2.5 px-3 text-right">Mora</th>
                        <th className="py-2.5 px-3 text-right">Total Pagado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-slate-600">{formatDate(p.fecha)}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{p.numero_recibo || '—'}</td>
                          <td className="py-2 px-3 font-mono">#{p.numero_cuota}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(p.capital, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(p.interes, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(p.seguro, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-rose-600">{formatMoney(p.mora, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right font-bold text-slate-900">{formatMoney(p.total, curSim)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold font-mono text-slate-900">
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-[11px] tracking-wider">
                          Totales ({totales?.pagos ?? 0} pagos)
                        </td>
                        <td className="py-2.5 px-3 text-right">{formatMoney(totales?.capital, curSim)}</td>
                        <td className="py-2.5 px-3 text-right">{formatMoney(totales?.interes, curSim)}</td>
                        <td className="py-2.5 px-3 text-right">{formatMoney(totales?.seguro, curSim)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600">{formatMoney(totales?.mora, curSim)}</td>
                        <td className="py-2.5 px-3 text-right text-[#006c49]">{formatMoney(totales?.total, curSim)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* Plan de Amortización Completo (S3) */}
            <Card className="p-5 space-y-4 border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0b1c30]">
                    Plan de Amortización y Cronograma
                  </h3>
                  <p className="text-xs text-slate-400">
                    Detalle de todas las cuotas pactadas, su vencimiento y saldo proyectado
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8f9ff] text-slate-500 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Cuota</th>
                      <th className="py-2.5 px-3">Vencimiento</th>
                      <th className="py-2.5 px-3 text-right">Capital</th>
                      <th className="py-2.5 px-3 text-right">Interés</th>
                      <th className="py-2.5 px-3 text-right">Seguro</th>
                      <th className="py-2.5 px-3 text-right">Cuota Total</th>
                      <th className="py-2.5 px-3 text-right">Saldo Capital</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuotas.map((c) => {
                      const isPagada = c.estado === 'PAGADA'
                      const isVencida = c.estado === 'VENCIDA'
                      return (
                        <tr key={c.numero} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono font-semibold">#{c.numero}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{formatDate(c.fecha_vencimiento)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(c.capital, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(c.interes, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-700">{formatMoney(c.seguro, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right font-bold text-slate-900">{formatMoney(c.monto_total, curSim)}</td>
                          <td className="py-2 px-3 font-mono text-right text-slate-600">{formatMoney(c.saldo_capital, curSim)}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={isPagada ? 'green' : isVencida ? 'red' : 'slate'} size="sm">
                              {c.estado}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA: LISTA DE CRÉDITOS DEL SOCIO
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Mis Créditos"
        subtitle="Consulta tus préstamos vigentes, tipo de crédito, amortización y extractos de pago."
      />

      {creditosError && (
        <AlertBanner variant="error" dismissible onDismiss={() => setCreditosError(null)}>
          {creditosError}
        </AlertBanner>
      )}

      {loadingCreditos ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <span className="material-symbols-outlined text-3xl animate-spin mb-2 block">
            progress_activity
          </span>
          Cargando tus créditos...
        </div>
      ) : creditos.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
            account_balance_wallet
          </span>
          <p className="text-sm font-medium text-slate-600">
            No tienes créditos registrados
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cuando adquieras un crédito en tu cooperativa, podrás consultar aquí sus detalles y extractos.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {creditos.map((c) => {
            const curSim = c.moneda === 'USD' ? '$' : 'Bs.'
            return (
              <Card key={c.id} className="p-5 sm:p-6 space-y-4 border-slate-200 hover:border-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {c.producto || 'Crédito'}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        ({c.numero_credito})
                      </span>
                    </div>

                    {/* S4: Tipo de crédito ASFI y Sistema de Amortización */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="navy">
                        {formatTipoCredito(c.tipo_credito)}
                      </Badge>
                      <Badge variant="teal">
                        Sistema {formatTipoAmortizacion(c.tipo_amortizacion)}
                      </Badge>
                    </div>
                  </div>

                  <Badge variant={c.estado === 'VIGENTE' ? 'green' : 'slate'}>
                    {c.estado}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Monto Desembolsado
                    </span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      {formatMoney(c.monto_desembolsado, curSim)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Saldo Pendiente
                    </span>
                    <span className="font-bold text-[#006c49] font-mono text-sm">
                      {formatMoney(c.saldo_pendiente, curSim)}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:col-span-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Próxima Cuota
                    </span>
                    {c.proxima_cuota ? (
                      <span className="font-semibold text-slate-800 font-mono">
                        Cuota #{c.proxima_cuota.numero} — {formatMoney(c.proxima_cuota.monto_total, curSim)} ({formatDate(c.proxima_cuota.fecha_vencimiento)})
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Al día / Sin cuotas pendientes</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectCredito(c.id)}
                    className="gap-1.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">receipt_long</span>
                    <span>Ver extracto de pagos</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
