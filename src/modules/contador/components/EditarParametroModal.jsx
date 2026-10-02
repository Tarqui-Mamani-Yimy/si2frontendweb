import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import CuentaContablePicker from './CuentaContablePicker'
import { updateParametroContable } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * EditarParametroModal — Modal para mapear cuenta contable a parámetro operativo (CU-W30).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   parametro: object | null,
 *   onSuccess: (updated: object) => void
 * }} props
 */
export default function EditarParametroModal({
  open,
  onClose,
  parametro,
  onSuccess,
}) {
  if (!open || !parametro) return null

  return (
    <EditarParametroForm
      key={parametro.clave}
      parametro={parametro}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function EditarParametroForm({ parametro, onClose, onSuccess }) {
  const [selectedAccount, setSelectedAccount] = useState(
    parametro.plan_cuenta || (parametro.plan_cuenta_id ? { id: parametro.plan_cuenta_id } : null),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!selectedAccount?.id) {
      setError('Debe seleccionar una cuenta contable válida.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        plan_cuenta_id: Number(selectedAccount.id),
      }
      const data = await updateParametroContable(parametro.clave, payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al actualizar el mapeo del parámetro contable.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Mapear Parámetro Contable"
      subtitle={`Configuración de imputación automática para ${parametro.clave}`}
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
            form="editar-parametro-form"
            variant="primary"
            size="sm"
            loading={loading}
            className="!bg-[#064e3b]"
          >
            Guardar Mapeo
          </Button>
        </div>
      }
    >
      <form id="editar-parametro-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <span className="text-slate-500 font-medium block">
            Clave del Parámetro:
          </span>
          <span className="font-mono font-bold text-[#064e3b] text-sm">
            {parametro.clave}
          </span>
          {parametro.descripcion && (
            <p className="text-[11px] text-slate-600 mt-1">
              {parametro.descripcion}
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Cuenta Contable Asignada <span className="text-red-500">*</span>
          </label>
          <CuentaContablePicker
            value={selectedAccount}
            onChange={(acc) => setSelectedAccount(acc)}
            hasError={!selectedAccount}
            placeholder="Seleccionar cuenta imputable..."
          />
          <p className="text-[11px] text-slate-400">
            Si la subcuenta tiene cuentas analíticas en esta cooperativa, el parámetro debe apuntar obligatoriamente a una cuenta analítica.
          </p>
        </div>
      </form>
    </Modal>
  )
}
