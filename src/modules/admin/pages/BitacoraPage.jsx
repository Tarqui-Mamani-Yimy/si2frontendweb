import { useCallback, useEffect, useState } from 'react'
import { fetchBitacora, fetchModulos } from '../../../core/api/adminApi'
import AlertBanner from '../../../components/ui/AlertBanner'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import PageHeader from '../../../components/ui/PageHeader'
import Skeleton from '../../../components/ui/Skeleton'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const MODULE_BADGE = {
  USUARIO:      'navy',
  SOCIO:        'green',
  CAJA:         'amber',
  CREDITO:      'purple',
  CREDITOS:     'purple',
  REPORTE:      'indigo',
  ROL:          'rose',
  SISTEMA:      'slate',
  CONTABILIDAD: 'teal',
  TRANSACCION:  'orange',
  DPF:          'pink',
}

function moduloBadgeVariant(modulo) {
  return MODULE_BADGE[modulo?.toUpperCase()] ?? 'slate'
}

const BITACORA_COLS = [
  { key: 'fecha',       label: 'Fecha',       cellClassName: 'whitespace-nowrap text-slate-500' },
  { key: 'modulo',      label: 'Módulo' },
  { key: 'accion',      label: 'Acción',      cellClassName: 'font-mono text-xs' },
  { key: 'usuario',     label: 'Usuario' },
  { key: 'descripcion', label: 'Descripción', cellClassName: 'max-w-xs truncate text-slate-500' },
  { key: 'ip',          label: 'IP',          cellClassName: 'font-mono text-xs text-slate-400' },
]

// ── Componente principal ───────────────────────────────────────────────────

export default function BitacoraPage() {
  const [bitacora,     setBitacora]     = useState([])
  const [modulos,      setModulos]      = useState([])
  const [loadingBit,   setLoadingBit]   = useState(true)
  const [errorBit,     setErrorBit]     = useState(null)
  const [filtroModulo, setFiltroModulo] = useState('')

  useEffect(() => {
    fetchModulos()
      .then(setModulos)
      .catch(() => {})
  }, [])

  const cargarBitacora = useCallback(() => {
    setLoadingBit(true)
    setErrorBit(null)
    fetchBitacora({ limite: 50, modulo: filtroModulo || undefined })
      .then(setBitacora)
      .catch((err) => setErrorBit(err?.response?.data?.detail ?? err.message ?? 'Error al cargar bitácora'))
      .finally(() => setLoadingBit(false))
  }, [filtroModulo])

  useEffect(() => { cargarBitacora() }, [cargarBitacora])

  const bitacoraRows = bitacora.map((reg) => ({
    id:          reg.id,
    fecha:       formatDate(reg.fecha_hora),
    modulo:      <Badge variant={moduloBadgeVariant(reg.modulo)}>{reg.modulo}</Badge>,
    accion:      reg.accion,
    usuario:     reg.usuario_nombre ?? `#${reg.usuario_id}`,
    descripcion: reg.descripcion ?? '—',
    ip:          reg.ip ?? '—',
  }))

  return (
    <div className="space-y-8 animate-fade-in">

      <PageHeader
        title="Bitácora del Sistema"
        subtitle="Registro de auditoría — actividad reciente"
      />

      <Card>
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 px-6 py-4">
          <select
            id="filtro-modulo"
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          >
            <option value="">Todos los módulos</option>
            {modulos.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={cargarBitacora}
            title="Recargar bitácora"
            aria-label="Recargar bitácora"
          >
            ↻
          </Button>
        </div>

        {loadingBit ? (
          <div className="space-y-2 p-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : errorBit ? (
          <div className="px-6 py-8">
            <AlertBanner variant="error" onClose={() => setErrorBit(null)}>
              {errorBit}
              <button onClick={cargarBitacora} className="ml-2 underline font-medium">Reintentar</button>
            </AlertBanner>
          </div>
        ) : (
          <DataTable
            columns={BITACORA_COLS}
            rows={bitacoraRows}
            emptyMessage={
              filtroModulo
                ? `No hay registros para el módulo "${filtroModulo}".`
                : 'No hay registros en la bitácora.'
            }
          />
        )}
      </Card>
    </div>
  )
}
