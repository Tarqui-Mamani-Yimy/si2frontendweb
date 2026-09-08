import { useEffect, useState } from 'react'
import * as savingsApi from '../../core/api/savingsApi'
import { fetchSocios } from '../../core/api/adminApi'
import AlertBanner from '../../components/ui/AlertBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'

const MONTO_MINIMO_APERTURA = { VISTA: 10, PROGRAMADO: 50 }

const EMPTY_ACCOUNT = { socio_id: '', moneda_id: '', tipo_producto: 'VISTA', monto_apertura: '' }
const EMPTY_CERTIFICATE = { socio_id: '', moneda_id: '', numero_titulos: '1', valor_unitario: '', fecha_emision: new Date().toISOString().slice(0, 10) }

const ESTADO_BADGE = { ACTIVA: 'green', BLOQUEADA: 'amber', CANCELADA: 'red' }

function errorMessage(error) {
  return error.response?.data?.detail ?? 'No se pudo completar la operación.'
}

function money(value, symbol = '') {
  return `${symbol}${Number(value ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-BO') : '—'
}

function SummaryCard({ label, value, detail, tone }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </Card>
  )
}

function OperationModal({ type, socios, monedas, onClose, onSubmit, saving, error }) {
  const isAccount = type === 'cuenta'
  const [form, setForm] = useState(isAccount ? EMPTY_ACCOUNT : EMPTY_CERTIFICATE)

  const montoMinimo = isAccount ? MONTO_MINIMO_APERTURA[form.tipo_producto] : null
  const montoTotal = !isAccount && form.numero_titulos && form.valor_unitario
    ? Number(form.numero_titulos) * Number(form.valor_unitario)
    : null

  function submit(event) {
    event.preventDefault()
    onSubmit({
      socio_id: Number(form.socio_id),
      moneda_id: Number(form.moneda_id),
      ...(isAccount
        ? { tipo_producto: form.tipo_producto, monto_apertura: Number(form.monto_apertura) }
        : { numero_titulos: Number(form.numero_titulos), valor_unitario: Number(form.valor_unitario), fecha_emision: form.fecha_emision }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          {isAccount ? 'Abrir cuenta de ahorro' : 'Emitir certificado de aportación'}
        </h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Socio</span>
            <select required value={form.socio_id} onChange={(e) => setForm({ ...form, socio_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seleccionar socio</option>
              {socios.map((socio) => <option key={socio.id} value={socio.id}>{socio.nombre} {socio.apellido} · {socio.ci}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Moneda</span>
            <select required value={form.moneda_id} onChange={(e) => setForm({ ...form, moneda_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seleccionar moneda</option>
              {monedas.map((moneda) => <option key={moneda.id} value={moneda.id}>{moneda.codigo_iso} · {moneda.nombre}</option>)}
            </select>
          </label>

          {isAccount ? (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Tipo de producto</span>
                <select required value={form.tipo_producto} onChange={(e) => setForm({ ...form, tipo_producto: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="VISTA">Cuenta a la vista</option>
                  <option value="PROGRAMADO">Ahorro programado</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Monto de apertura</span>
                <input required min={montoMinimo} step="0.01" type="number" value={form.monto_apertura} onChange={(e) => setForm({ ...form, monto_apertura: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <span className="mt-1 block text-xs text-slate-500">Monto mínimo para este producto: {montoMinimo}</span>
              </label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Número de títulos</span>
                  <input required min="1" step="1" type="number" value={form.numero_titulos} onChange={(e) => setForm({ ...form, numero_titulos: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Valor unitario</span>
                  <input required min="0.01" step="0.01" type="number" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Fecha de emisión</span>
                <input required type="date" value={form.fecha_emision} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              {montoTotal !== null && (
                <p className="text-sm text-slate-600">Monto total: <span className="font-semibold text-slate-900">{money(montoTotal)}</span></p>
              )}
            </>
          )}
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </div>
  )
}

const PRODUCTO_LABEL = { VISTA: 'Vista', PROGRAMADO: 'Programado' }

function AccountsTable({ accounts, onMovement, onEstadoChange }) {
  const gestionable = Boolean(onMovement)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-3">Cuenta</th>
            <th className="px-6 py-3">Producto</th>
            <th className="px-6 py-3">Socio</th>
            <th className="px-6 py-3">Saldo disponible</th>
            <th className="px-6 py-3">Fecha apertura</th>
            <th className="px-6 py-3">Estado</th>
            {gestionable && <th className="px-6 py-3 text-right">Operaciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="px-6 py-3 font-mono text-xs">{account.numero}</td>
              <td className="px-6 py-3">{PRODUCTO_LABEL[account.tipo_producto] ?? account.tipo_producto}</td>
              <td className="px-6 py-3">Socio #{account.socio_id}</td>
              <td className="px-6 py-3 font-semibold">{money(account.saldo_disponible, account.moneda.simbolo)}</td>
              <td className="px-6 py-3 text-slate-500">{formatDate(account.fecha_registro)}</td>
              <td className="px-6 py-3"><Badge variant={ESTADO_BADGE[account.estado] ?? 'slate'}>{account.estado}</Badge></td>
              {gestionable && (
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  {account.estado === 'ACTIVA' && (
                    <>
                      <button type="button" onClick={() => onMovement({ type: 'DEPOSITO', account })} className="mr-3 text-xs font-semibold text-forest">Depositar</button>
                      <button type="button" onClick={() => onMovement({ type: 'RETIRO', account })} className="mr-3 text-xs font-semibold text-red-600">Retirar</button>
                      <button type="button" onClick={() => onEstadoChange(account, 'BLOQUEADA')} className="mr-3 text-xs font-semibold text-amber-600">Bloquear</button>
                      <button type="button" onClick={() => onEstadoChange(account, 'CANCELADA')} className="text-xs font-semibold text-slate-500">Cancelar</button>
                    </>
                  )}
                  {account.estado === 'BLOQUEADA' && (
                    <>
                      <button type="button" onClick={() => onEstadoChange(account, 'ACTIVA')} className="mr-3 text-xs font-semibold text-forest">Reactivar</button>
                      <button type="button" onClick={() => onEstadoChange(account, 'CANCELADA')} className="text-xs font-semibold text-slate-500">Cancelar</button>
                    </>
                  )}
                  {account.estado === 'CANCELADA' && <span className="text-xs text-slate-400">—</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CertificatesTable({ certificates, onDownload }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-3">N.º</th>
            <th className="px-6 py-3">Socio</th>
            <th className="px-6 py-3">Títulos</th>
            <th className="px-6 py-3">Valor unitario</th>
            <th className="px-6 py-3">Monto</th>
            <th className="px-6 py-3">Fecha</th>
            {onDownload && <th className="px-6 py-3 text-right">Comprobante</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {certificates.map((certificate) => (
            <tr key={certificate.id}>
              <td className="px-6 py-3 font-mono text-xs">{String(certificate.correlativo).padStart(6, '0')}</td>
              <td className="px-6 py-3">Socio #{certificate.socio_id}</td>
              <td className="px-6 py-3">{certificate.numero_titulos}</td>
              <td className="px-6 py-3">{money(certificate.valor_unitario, certificate.moneda.simbolo)}</td>
              <td className="px-6 py-3 font-semibold">{money(certificate.monto, certificate.moneda.simbolo)}</td>
              <td className="px-6 py-3 text-slate-500">{formatDate(certificate.fecha_emision)}</td>
              {onDownload && (
                <td className="px-6 py-3 text-right">
                  <button type="button" onClick={() => onDownload(certificate.id)} className="text-xs font-semibold text-navy">Descargar PDF</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SavingsModulePage({ personal = false }) {
  const [activeTab, setActiveTab] = useState('cuentas')
  const [accounts, setAccounts] = useState([])
  const [certificates, setCertificates] = useState([])
  const [socios, setSocios] = useState([])
  const [monedas, setMonedas] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [movement, setMovement] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const currencies = savingsApi.listMonedas()
      if (personal) {
        const [ownAccounts, ownCertificates, currencyList] = await Promise.all([savingsApi.listMisCuentas(), savingsApi.listMisCertificados(), currencies])
        setAccounts(ownAccounts)
        setCertificates(ownCertificates)
        setMonedas(currencyList)
      } else {
        const [allAccounts, allCertificates, currencyList, members] = await Promise.all([savingsApi.listCuentas(), savingsApi.listCertificados(), currencies, fetchSocios({ limite: 200 })])
        setAccounts(allAccounts)
        setCertificates(allCertificates)
        setMonedas(currencyList)
        setSocios(members)
      }
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [personal])

  async function submitOperation(payload) {
    setSaving(true)
    setError(null)
    try {
      if (modal === 'cuenta') await savingsApi.openCuenta(payload)
      else await savingsApi.issueCertificado(payload)
      setModal(null)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function submitMovement(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (movement.type === 'DEPOSITO') await savingsApi.depositar(movement.account.id, Number(movement.amount))
      else await savingsApi.retirar(movement.account.id, Number(movement.amount))
      setMovement(null)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function changeEstado(account, estado) {
    const confirmaciones = {
      BLOQUEADA: `¿Bloquear la cuenta ${account.numero}?`,
      CANCELADA: `¿Cancelar la cuenta ${account.numero}? Esta acción no se puede deshacer.`,
      ACTIVA: `¿Reactivar la cuenta ${account.numero}?`,
    }
    if (confirmaciones[estado] && !window.confirm(confirmaciones[estado])) return
    setError(null)
    try {
      await savingsApi.updateCuentaEstado(account.id, estado)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function downloadPdf(certificadoId) {
    setError(null)
    try {
      await savingsApi.downloadCertificadoPdf(certificadoId)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const totalBalance = accounts.reduce((total, account) => total + Number(account.saldo_disponible ?? 0), 0)
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={personal ? 'Mi cuenta' : 'Ahorros y aportes'} subtitle={personal ? 'Consulta tus cuentas de ahorro, saldos y certificados de aportación.' : 'Administra cuentas de ahorro y certificados de aportación.'} action={!personal && <div className="flex gap-2"><Button size="sm" onClick={() => setModal('cuenta')}>Abrir cuenta</Button><Button size="sm" variant="secondary" onClick={() => setModal('certificado')}>Emitir aporte</Button></div>} />
      <div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Cuentas activas" value={accounts.filter((account) => account.estado === 'ACTIVA').length} detail="Cuentas de ahorro" tone="text-navy" /><SummaryCard label="Saldo total" value={money(totalBalance)} detail="Suma referencial de saldos" tone="text-forest" /><SummaryCard label="Aportes emitidos" value={certificates.length} detail="Certificados registrados" tone="text-amber-700" /></div>
      {error && <AlertBanner variant="error" onClose={() => setError(null)}>{error}</AlertBanner>}
      <Card><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4"><div className="flex gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setActiveTab('cuentas')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'cuentas' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>Cuentas de ahorro</button><button type="button" onClick={() => setActiveTab('aportes')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'aportes' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>Aportes</button></div><Button type="button" variant="secondary" size="sm" onClick={load} disabled={loading}>Recargar</Button></div>{loading ? <p className="px-6 py-14 text-center text-sm text-slate-500">Cargando información…</p> : activeTab === 'cuentas' ? (accounts.length ? <AccountsTable accounts={accounts} onMovement={personal ? null : setMovement} onEstadoChange={changeEstado} /> : <p className="px-6 py-14 text-center text-sm text-slate-500">No hay cuentas de ahorro registradas.</p>) : (certificates.length ? <CertificatesTable certificates={certificates} onDownload={downloadPdf} /> : <p className="px-6 py-14 text-center text-sm text-slate-500">No hay certificados de aportación registrados.</p>)}</Card>
      {modal && <OperationModal type={modal} socios={socios} monedas={monedas} onClose={() => setModal(null)} onSubmit={submitOperation} saving={saving} error={error} />}
      {movement && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={submitMovement} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">{movement.type === 'DEPOSITO' ? 'Depositar' : 'Retirar'} · {movement.account.numero}</h2><input required min="0.01" step="0.01" type="number" autoFocus value={movement.amount ?? ''} onChange={(e) => setMovement({ ...movement, amount: e.target.value })} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Monto" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setMovement(null)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button><button className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">Confirmar</button></div></form></div>}
    </div>
  )
}
