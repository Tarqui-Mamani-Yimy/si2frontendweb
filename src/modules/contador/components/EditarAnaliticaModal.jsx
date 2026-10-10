import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import AlertBanner from '../../../components/ui/AlertBanner'
import { FormField, Input, Textarea } from '../../../components/ui/FormField'
import { updateCuentaAnalitica } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * EditarAnaliticaModal — Edición de nombre y descripción de cuenta analítica (CU-W29).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   account: object | null,
 *   onSuccess: (updatedAccount: object) => void
 * }} props
 */
export default function EditarAnaliticaModal({
  open,
  onClose,
  account,
  onSuccess,
}) {
  if (!open || !account) return null

  return (
    <EditarAnaliticaForm
      key={account.id}
      account={account}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function EditarAnaliticaForm({ account, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(account.nombre || '')
  const [descripcion, setDescripcion] = useState(account.descripcion || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre de la cuenta analítica no puede estar vacío.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      }
      const data = await updateCuentaAnalitica(account.id, payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Error al actualizar la cuenta analítica.',
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
      title="Editar Cuenta Analítica"
      subtitle={`Modificación de datos para ${account.codigo}`}
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
            form="editar-analitica-form"
            variant="primary"
            size="sm"
            loading={loading}
            className="!bg-[#064e3b]"
          >
            Guardar Cambios
          </Button>
        </div>
      }
    >
      <form id="editar-analitica-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBanner variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AlertBanner>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <span className="text-slate-500 font-medium block">
            Código de Cuenta:
          </span>
          <span className="font-mono font-bold text-[#064e3b] text-sm">
            {account.codigo}
          </span>
        </div>

        <FormField id="edit_nombre" label="Nombre de la Cuenta" required>
          <Input
            id="edit_nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />
        </FormField>

        <FormField id="edit_descripcion" label="Descripción (Opcional)">
          <Textarea
            id="edit_descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </FormField>
      </form>
    </Modal>
  )
}
