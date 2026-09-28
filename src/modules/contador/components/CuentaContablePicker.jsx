import { useState, useEffect, useRef } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import { listPlanCuentas } from '../../../core/api/contabilidadApi'
import { getApiErrorMessage } from '../../../core/api/errors'

/**
 * CuentaContablePicker — Selector modal de cuentas contables que aceptan movimientos (CU-W30).
 * Protegido contra condiciones de carrera ignorando respuestas obsoletas.
 *
 * @param {{
 *   value: object | number | string | null,
 *   onChange: (account: object) => void,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   hasError?: boolean,
 * }} props
 */
export default function CuentaContablePicker({
  value,
  onChange,
  placeholder = 'Seleccionar cuenta contable...',
  disabled = false,
  hasError = false,
}) {
  const [openModal, setOpenModal] = useState(false)

  // Current display text
  let displayCode = ''
  let displayName = ''
  if (value && typeof value === 'object') {
    displayCode = value.codigo || ''
    displayName = value.nombre || ''
  }

  return (
    <div>
      <div
        onClick={() => {
          if (!disabled) setOpenModal(true)
        }}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition select-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : hasError
              ? 'border-red-400 bg-red-50/40 hover:border-red-500'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
            account_balance
          </span>
          {displayCode ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-bold text-[#064e3b] shrink-0">
                {displayCode}
              </span>
              <span className="text-slate-800 truncate">{displayName}</span>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        {!disabled && (
          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
            search
          </span>
        )}
      </div>

      {openModal && (
        <CuentaSearchModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSelect={(account) => {
            onChange(account)
            setOpenModal(false)
          }}
          selectedId={value?.id || (typeof value === 'number' ? value : null)}
        />
      )}
    </div>
  )
}

function CuentaSearchModal({ open, onClose, onSelect, selectedId }) {
  const [query, setQuery] = useState('')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Ref to track latest request ID and prevent race conditions
  const requestIdRef = useRef(0)

  // Load initial accounts on mount without synchronous setState in effect
  useEffect(() => {
    let isMounted = true
    const reqId = ++requestIdRef.current

    listPlanCuentas({ solo_movimiento: true, estado: 'ACTIVA' })
      .then((data) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        const items = Array.isArray(data) ? data : data?.items || []
        setAccounts(items)
      })
      .catch((err) => {
        if (!isMounted || reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar las cuentas contables que aceptan movimientos.',
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
  }, [])

  function handleSearch(searchQuery) {
    const reqId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    const params = {
      solo_movimiento: true,
      estado: 'ACTIVA',
    }
    if (searchQuery.trim()) {
      params.q = searchQuery.trim()
    }

    listPlanCuentas(params)
      .then((data) => {
        if (reqId !== requestIdRef.current) return
        const items = Array.isArray(data) ? data : data?.items || []
        setAccounts(items)
      })
      .catch((err) => {
        if (reqId !== requestIdRef.current) return
        setError(
          getApiErrorMessage(
            err,
            'Error al cargar las cuentas contables que aceptan movimientos.',
          ),
        )
      })
      .finally(() => {
        if (reqId === requestIdRef.current) {
          setLoading(false)
        }
      })
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Seleccionar Cuenta Contable"
      subtitle="Únicamente cuentas que aceptan movimientos contables (CU-W29 / CU-W30)"
      footer={
        <div className="flex justify-end w-full">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Search input form */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[17px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por código (ej. 111.01) o nombre..."
              value={query}
              onChange={(e) => {
                const next = e.target.value
                setQuery(next)
                handleSearch(next)
              }}
              autoFocus
              className="w-full h-8 pl-8 pr-2 text-xs rounded border-0 bg-transparent text-[#0b1c30] placeholder:text-slate-400 outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs">
            Buscar
          </Button>
        </form>

        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        {/* Results list */}
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
              search_off
            </span>
            <p className="text-xs font-semibold text-slate-700">
              No se encontraron cuentas contables imputables
            </p>
            <p className="text-[11px] text-slate-400">
              Verifique que la cuenta exista en el Plan de Cuentas y acepte movimientos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {accounts.map((acc) => {
              const isSelected = selectedId === acc.id
              return (
                <div
                  key={acc.id}
                  onClick={() => onSelect(acc)}
                  className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-emerald-50/80 border-l-4 border-[#064e3b]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#064e3b]">
                        {acc.codigo}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Nivel {acc.nivel}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 truncate">
                      {acc.nombre}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={acc.naturaleza === 'DEUDORA' ? 'teal' : 'navy'}
                      className="!text-[9px] !py-0 !px-1.5"
                    >
                      {acc.naturaleza === 'DEUDORA' ? 'Deudora' : 'Acreedora'}
                    </Badge>
                    {acc.es_oficial ? (
                      <Badge variant="slate" className="!text-[9px] !py-0 !px-1.5">
                        ASFI
                      </Badge>
                    ) : (
                      <Badge variant="purple" className="!text-[9px] !py-0 !px-1.5">
                        Analítica
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
