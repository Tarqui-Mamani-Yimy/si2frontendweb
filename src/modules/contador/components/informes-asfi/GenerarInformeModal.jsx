import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { FormField, Input } from '../../../../components/ui/FormField'
import { generarInforme } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import { getTodayIso } from '../contabilidadUtils'

const TIPOS_DISPONIBLES = [
  { value: 'CALIFICACION_CARTERA', label: 'Calificación de Cartera y Previsiones' },
  { value: 'ESTADOS_FINANCIEROS', label: 'Estados Financieros (Paquete Mensual MCEF)' },
  { value: 'CARTERA_DEUDORES', label: 'Cartera por Deudores (Formato CIC)' },
]

function GenerarInformeForm({
  open,
  onClose,
  defaultTipo,
  defaultFechaCorte,
  onSuccess,
}) {
  const today = getTodayIso()
  const [tipo, setTipo] = useState(defaultTipo || 'CALIFICACION_CARTERA')
  const [fechaCorte, setFechaCorte] = useState(defaultFechaCorte || today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!tipo) {
      setError('Seleccione un tipo de informe.')
      return
    }

    if (!fechaCorte) {
      setError('La fecha de corte es obligatoria.')
      return
    }

    if (fechaCorte > today) {
      setError('La fecha de corte no puede ser una fecha futura.')
      return
    }

    setSaving(true)

    try {
      const res = await generarInforme({
        tipo,
        fecha_corte: fechaCorte,
      })
      onSuccess?.(res)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al generar el informe normativo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar Informe Normativo Oficial"
      subtitle="Genera y almacena un snapshot inmutable con firma SHA-256 para auditoría ASFI"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="generar-informe-form" loading={saving}>
            Generar Snapshot
          </Button>
        </div>
      }
    >
      <form id="generar-informe-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" onClose={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-900 space-y-1">
          <span className="font-semibold block text-sky-950">
            Registro Oficial e Integridad Criptográfica:
          </span>
          <p className="text-sky-800 leading-relaxed text-[11px]">
            Al generar el informe, se calcularán los datos a la fecha de corte indicada y se registrará un snapshot permanente con hash SHA-256 en la base de datos institucional. Si ya existía un informe para el mismo periodo y tipo, el anterior pasará a estado REEMPLAZADO para mantener la trazabilidad histórica completa.
          </p>
        </div>

        <FormField id="tipo_informe" label="Tipo de Informe Regulatorio" required>
          <select
            id="tipo_informe"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-[#0b1c30] outline-none transition focus:border-[#006c49] focus:bg-white focus:ring-2 focus:ring-[#006c49]/20"
          >
            {TIPOS_DISPONIBLES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="fecha_corte_generar" label="Fecha de Corte" required>
          <Input
            id="fecha_corte_generar"
            type="date"
            max={today}
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
            required
          />
        </FormField>
      </form>
    </Modal>
  )
}

/**
 * Modal to generate official immutable report snapshot (CU-W34).
 */
export default function GenerarInformeModal({
  open,
  onClose,
  defaultTipo = 'CALIFICACION_CARTERA',
  defaultFechaCorte,
  onSuccess,
}) {
  if (!open) return null

  return (
    <GenerarInformeForm
      open={open}
      onClose={onClose}
      defaultTipo={defaultTipo}
      defaultFechaCorte={defaultFechaCorte}
      onSuccess={onSuccess}
    />
  )
}
