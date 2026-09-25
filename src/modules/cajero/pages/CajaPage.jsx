import { useState, useEffect } from 'react'
import { getSesionActual } from '../../../core/api/cajaApi'
import { selectUser, useAuthStore } from '../../../core/store/authStore'
import PageHeader from '../../../components/ui/PageHeader'
import Badge from '../../../components/ui/Badge'
import Skeleton from '../../../components/ui/Skeleton'
import AlertBanner from '../../../components/ui/AlertBanner'
import AperturaCajaCard from '../components/AperturaCajaCard'
import DepositoTab from '../components/DepositoTab'
import TransferenciaTab from '../components/TransferenciaTab'
import ArqueoTab from '../components/ArqueoTab'
import ReciboCajaModal from '../components/ReciboCajaModal'
import HojaArqueoModal from '../components/HojaArqueoModal'

function formatMoney(value, simbolo = 'Bs') {
  const n = Number(value ?? 0)
  return `${simbolo} ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CajaPage() {
  const user = useAuthStore(selectUser)

  const [sesion, setSesion] = useState(null)
  const [loadingSesion, setLoadingSesion] = useState(true)
  const [errorSesion, setErrorSesion] = useState(null)
  const [activeTab, setActiveTab] = useState('deposito') // 'deposito' | 'transferencia' | 'arqueo'

  // Estado del modal de comprobante
  const [reciboModal, setReciboModal] = useState({
    open: false,
    tipo: 'DEPOSITO',
    datos: null,
  })

  // Estado del modal de hoja de arqueo (CU-W15)
  const [hojaArqueoModal, setHojaArqueoModal] = useState({
    open: false,
    datos: null,
  })

  useEffect(() => {
    let isMounted = true
    getSesionActual()
      .then((data) => {
        if (!isMounted) return
        setSesion(data)
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorSesion(err.response?.data?.detail ?? 'Error al verificar el estado de la sesión de caja.')
      })
      .finally(() => {
        if (isMounted) setLoadingSesion(false)
      })

    return () => { isMounted = false }
  }, [])

  function handleAperturaSuccess(nuevaSesion) {
    setSesion(nuevaSesion)
    setReciboModal({
      open: true,
      tipo: 'APERTURA',
      datos: nuevaSesion,
    })
  }

  function handleDepositoSuccess(reciboData) {
    // Actualizar el saldo en sistema de la sesión activa
    if (reciboData?.monto && sesion) {
      const nuevoSaldo = Number(sesion.saldo_sistema ?? 0) + Number(reciboData.monto)
      setSesion((prev) => (prev ? { ...prev, saldo_sistema: nuevoSaldo } : null))
    }

    setReciboModal({
      open: true,
      tipo: 'DEPOSITO',
      datos: reciboData,
    })
  }

  function handleTransferenciaSuccess(reciboData) {
    setReciboModal({
      open: true,
      tipo: 'TRANSFERENCIA',
      datos: reciboData,
    })
  }

  function handleArqueoSuccess(arqueoData) {
    setHojaArqueoModal({
      open: true,
      datos: arqueoData,
    })
    if (arqueoData?.cierre) {
      setSesion(null)
      setActiveTab('deposito')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Encabezado Principal ── */}
      <PageHeader
        title="Operaciones de Caja en Ventanilla"
        subtitle="Gestión de turno fiduciario, recepción de depósitos y transferencias internas."
      />

      {loadingSesion ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : errorSesion ? (
        <AlertBanner variant="error" onClose={() => setErrorSesion(null)}>
          {errorSesion}
        </AlertBanner>
      ) : !sesion ? (
        /* ── Caso: Sin Sesión Abierta (CU-W10) ── */
        <AperturaCajaCard onAperturaSuccess={handleAperturaSuccess} />
      ) : (
        /* ── Caso: Sesión Abierta y Activa (CU-W11, CU-W13, CU-W15) ── */
        <div className="space-y-6">

          {/* Tarjeta Informativa de la Sesión Activa */}
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-6 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#064e3b] flex items-center justify-center border border-emerald-200/60 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      {sesion.caja_nombre ?? `Caja #${sesion.caja_id}`}
                    </h2>
                    <Badge variant="green">{sesion.estado}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Apertura registrada el {sesion.fecha_apertura ? new Date(sesion.fecha_apertura).toLocaleString('es-BO') : 'Hoy'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Efectivo Inicial
                  </span>
                  <span className="font-display font-semibold text-slate-700 text-sm tabular-nums">
                    {formatMoney(sesion.monto_apertura)}
                  </span>
                </div>

                <div className="text-right pl-4 border-l border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-[#006c49] block tracking-wider">
                    Saldo en Bóveda / Caja
                  </span>
                  <span className="font-display font-bold text-[#064e3b] text-xl tabular-nums">
                    {formatMoney(sesion.saldo_sistema)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación de Flujos */}
            <div className="mt-4 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('deposito')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'deposito'
                    ? 'border-[#064e3b] text-[#064e3b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Depósitos en Efectivo (CU-W11)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transferencia')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'transferencia'
                    ? 'border-[#064e3b] text-[#064e3b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span>Transferencias Internas (CU-W13)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('arqueo')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'arqueo'
                    ? 'border-[#064e3b] text-[#064e3b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">balance</span>
                <span>Arqueo y Conciliación (CU-W15)</span>
              </button>
            </div>
          </div>

          {/* ── Contenido de la Pestaña Activa ── */}
          {activeTab === 'deposito' && (
            <DepositoTab onDepositoExitoso={handleDepositoSuccess} />
          )}

          {activeTab === 'transferencia' && (
            <TransferenciaTab onTransferenciaExitosa={handleTransferenciaSuccess} />
          )}

          {activeTab === 'arqueo' && (
            <ArqueoTab onArqueoExitoso={handleArqueoSuccess} />
          )}
        </div>
      )}

      {/* ── Modal de Comprobante Imprimible ── */}
      <ReciboCajaModal
        open={reciboModal.open}
        onClose={() => setReciboModal({ open: false, tipo: 'DEPOSITO', datos: null })}
        tipo={reciboModal.tipo}
        datos={reciboModal.datos}
        cooperativaNombre={user?.cooperativa?.nombre}
      />

      {/* ── Modal de Hoja de Arqueo Imprimible (CU-W15) ── */}
      <HojaArqueoModal
        open={hojaArqueoModal.open}
        onClose={() => setHojaArqueoModal({ open: false, datos: null })}
        datos={hojaArqueoModal.datos}
        cooperativaNombre={user?.cooperativa?.nombre}
      />
    </div>
  )
}
