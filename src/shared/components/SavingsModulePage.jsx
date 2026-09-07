import { useEffect, useState } from 'react'
import * as savingsApi from '../../core/api/savingsApi'
import { fetchSocios } from '../../core/api/adminApi'
import AlertBanner from '../../components/ui/AlertBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'

const EMPTY_ACCOUNT = { socio_id: '', moneda_id: '' }
const EMPTY_CERTIFICATE = { socio_id: '', moneda_id: '', monto: '' }

function errorMessage(error) {
  return error.response?.data?.detail ?? 'No se pudo completar la operación.'
}

function money(value, symbol = '') {
  return `${symbol}${Number(value ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
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

  function submit(event) {
    event.preventDefault()
    onSubmit({
      ...form,
      socio_id: Number(form.socio_id),
      moneda_id: Number(form.moneda_id),
      ...(isAccount ? {} : { monto: Number(form.monto) }),
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
          {!isAccount && <label className="block"><span className="text-sm font-medium text-slate-700">Monto</span><input required min="0.01" step="0.01" type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>}
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </div>
  )
}

function AccountsTable({ accounts, onMovement }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3">Cuenta</th><th className="px-6 py-3">Socio</th><th className="px-6 py-3">Saldo disponible</th><th className="px-6 py-3">Estado</th>{onMovement && <th className="px-6 py-3 text-right">Operaciones</th>}</tr></thead><tbody className="divide-y divide-slate-100">{accounts.map((account) => <tr key={account.id}><td className="px-6 py-3 font-mono text-xs">{account.numero}</td><td className="px-6 py-3">Socio #{account.socio_id}</td><td className="px-6 py-3 font-semibold">{money(account.saldo_disponible, account.moneda.simbolo)}</td><td className="px-6 py-3"><Badge variant={account.estado === 'ACTIVA' ? 'green' : 'slate'}>{account.estado}</Badge></td>{onMovement && <td className="px-6 py-3 text-right"><button type="button" onClick={() => onMovement({ type: 'DEPOSITO', account })} className="mr-3 text-xs font-semibold text-forest">Depositar</button><button type="button" onClick={() => onMovement({ type: 'RETIRO', account })} className="text-xs font-semibold text-red-600">Retirar</button></td>}</tr>)}</tbody></table></div>
}

function CertificatesTable({ certificates }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3">Certificado</th><th className="px-6 py-3">Socio</th><th className="px-6 py-3">Monto</th><th className="px-6 py-3">Fecha</th></tr></thead><tbody className="divide-y divide-slate-100">{certificates.map((certificate) => <tr key={certificate.id}><td className="px-6 py-3 font-mono text-xs">#{certificate.id}</td><td className="px-6 py-3">Socio #{certificate.socio_id}</td><td className="px-6 py-3 font-semibold">{money(certificate.monto, certificate.moneda.simbolo)}</td><td className="px-6 py-3">{new Date(certificate.fecha_emision).toLocaleDateString('es-BO')}</td></tr>)}</tbody></table></div>
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

  const totalBalance = accounts.reduce((total, account) => total + Number(account.saldo_disponible ?? 0), 0)
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={personal ? 'Mi cuenta' : 'Ahorros y aportes'} subtitle={personal ? 'Consulta tus cuentas de ahorro, saldos y certificados de aportación.' : 'Administra cuentas de ahorro y certificados de aportación.'} action={!personal && <div className="flex gap-2"><Button size="sm" onClick={() => setModal('cuenta')}>Abrir cuenta</Button><Button size="sm" variant="secondary" onClick={() => setModal('certificado')}>Emitir aporte</Button></div>} />
      <div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Cuentas activas" value={accounts.filter((account) => account.estado === 'ACTIVA').length} detail="Cuentas de ahorro" tone="text-navy" /><SummaryCard label="Saldo total" value={money(totalBalance)} detail="Suma referencial de saldos" tone="text-forest" /><SummaryCard label="Aportes emitidos" value={certificates.length} detail="Certificados registrados" tone="text-amber-700" /></div>
      {error && <AlertBanner variant="error" onClose={() => setError(null)}>{error}</AlertBanner>}
      <Card><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4"><div className="flex gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setActiveTab('cuentas')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'cuentas' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>Cuentas de ahorro</button><button type="button" onClick={() => setActiveTab('aportes')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'aportes' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>Aportes</button></div><Button type="button" variant="secondary" size="sm" onClick={load} disabled={loading}>Recargar</Button></div>{loading ? <p className="px-6 py-14 text-center text-sm text-slate-500">Cargando información…</p> : activeTab === 'cuentas' ? (accounts.length ? <AccountsTable accounts={accounts} onMovement={setMovement} /> : <p className="px-6 py-14 text-center text-sm text-slate-500">No hay cuentas de ahorro registradas.</p>) : (certificates.length ? <CertificatesTable certificates={certificates} /> : <p className="px-6 py-14 text-center text-sm text-slate-500">No hay certificados de aportación registrados.</p>)}</Card>
      {modal && <OperationModal type={modal} socios={socios} monedas={monedas} onClose={() => setModal(null)} onSubmit={submitOperation} saving={saving} error={error} />}
      {movement && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={submitMovement} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">{movement.type === 'DEPOSITO' ? 'Depositar' : 'Retirar'} · {movement.account.numero}</h2><input required min="0.01" step="0.01" type="number" autoFocus value={movement.amount ?? ''} onChange={(e) => setMovement({ ...movement, amount: e.target.value })} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Monto" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setMovement(null)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button><button className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">Confirmar</button></div></form></div>}
    </div>
  )
}
