import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../components/ui/FormField'
import { createCuentaAnalitica, listPlanCuentas } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * CrearAnaliticaModal — Modal para dar de alta una cuenta analítica de nivel 5 (CU-W29).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   parentAccount?: object | null,
 *   onSuccess: (createdAccount: object) => void
 * }} props
 */
export default function CrearAnaliticaModal({
  open,
  onClose,
  parentAccount,
  onSuccess,
}) {
  if (!open) return null

  return (
    <CrearAnaliticaForm
      key={parentAccount?.id ?? 'sin-padre'}
      onClose={onClose}
      parentAccount={parentAccount}
      onSuccess={onSuccess}
    />
  )
}

function CrearAnaliticaForm({ onClose, parentAccount, onSuccess }) {
  const [padreId, setPadreId] = useState(parentAccount?.id ?? '')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Subcuentas oficiales nivel 4 disponibles para selección si no viene padre predeterminado
  const [subcuentas, setSubcuentas] = useState([])
  const [loadingSubcuentas, setLoadingSubcuentas] = useState(!parentAccount)

  useEffect(() => {
    if (parentAccount) return
    let isMounted = true

    listPlanCuentas({ nivel: 4, estado: 'ACTIVA' })
      .then((data) => {
        if (!isMounted) return
        const items = Array.isArray(data) ? data : data?.items || []
        const oficiales = items.filter((i) => i.es_oficial !== false)
        setSubcuentas(oficiales)
        if (oficiales.length > 0) {
          setPadreId((curr) => (curr ? curr : oficiales[0].id))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingSubcuentas(false)
      })

    return () => {
      isMounted = false
    }
  }, [parentAccount])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!padreId) {
      setError('Debe seleccionar una subcuenta oficial de nivel 4 como padre.')
      return
    }

    if (!nombre.trim()) {
      setError('El nombre de la cuenta analítica es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        padre_id: Number(padreId),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      }
      const data = await createCuentaAnalitica(payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al crear la cuenta analítica. Verifique los datos.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedParent = parentAccount || subcuentas.find((s) => s.id === Number(padreId))

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Crear Cuenta Analítica"
      subtitle="Alta de cuenta de nivel 5 propia de la cooperativa (CU-W29)"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="crear-analitica-form"
            variant="primary"
            size="sm"
            loading={loading}
            className="!bg-[#064e3b]"
          >
            Guardar Cuenta Analítica
          </Button>
        </div>
      }
    >
      <form id="crear-analitica-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        {/* Subcuenta Padre */}
        {parentAccount ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <span className="text-slate-500 font-medium block">
              Subcuenta Padre (Nivel 4 Oficial ASFI):
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#064e3b] text-sm">
                {parentAccount.codigo}
              </span>
              <span className="text-slate-800 font-semibold truncate">
                {parentAccount.nombre}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              El correlativo de 2 dígitos se generará automáticamente por el servidor.
            </p>
          </div>
        ) : (
          <FormField
            id="padre_id"
            label="Subcuenta Padre (Nivel 4 Oficial ASFI)"
            required
          >
            {loadingSubcuentas ? (
              <div className="text-xs text-slate-500 py-2">Cargando subcuentas...</div>
            ) : (
              <select
                id="padre_id"
                value={padreId}
                onChange={(e) => setPadreId(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 text-xs text-[#0b1c30] outline-none focus:border-[#006c49] focus:bg-white"
                required
              >
                <option value="">Seleccione una subcuenta nivel 4...</option>
                {subcuentas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo} — {s.nombre}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        )}

        {selectedParent && (
          <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">
              info
            </span>
            <span>
              La cuenta analítica heredará la naturaleza{' '}
              <strong>{selectedParent.naturaleza ?? 'DEUDORA'}</strong> de la subcuenta y aceptará movimientos contables.
            </span>
          </div>
        )}

        {/* Nombre de la cuenta */}
        <FormField
          id="nombre_analitica"
          label="Nombre de la Cuenta Analítica"
          required
        >
          <Input
            id="nombre_analitica"
            type="text"
            placeholder="Ej. Caja Principal Moneda Nacional, Banco Unión Cta. Cte."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />
        </FormField>

        {/* Descripción */}
        <FormField id="descripcion_analitica" label="Descripción (Opcional)">
          <Textarea
            id="descripcion_analitica"
            placeholder="Finalidad operativa, uso restringido o notas contables de la cooperativa..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </FormField>
      </form>
    </Modal>
  )
}
