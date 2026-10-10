import { useState, useEffect, useMemo } from 'react'
import { getCatalogoInformes } from '../../../../core/api/informesAsfiApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import AlertBanner from '../../../../components/ui/AlertBanner'


/**
 * Tab: Catálogo Normativo ASFI (CU-W34).
 * Lista todos los informes regulatorios con estado Implementado / Fuera de alcance y fuentes primarias.
 */
export default function CatalogoTab() {
  const [catalogo, setCatalogo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('TODOS') // 'TODOS', 'IMPLEMENTADOS', 'FUERA_ALCANCE'

  useEffect(() => {
    let isMounted = true

    getCatalogoInformes()
      .then((res) => {
        if (!isMounted) return
        setCatalogo(Array.isArray(res) ? res : [])
      })
      .catch((err) => {
        if (!isMounted) return
        setCatalogo([])
        setError(getApiErrorMessage(err, 'No fue posible cargar el catálogo normativo desde el servidor.'))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filtrados = useMemo(() => {
    if (filtro === 'IMPLEMENTADOS') return catalogo.filter((c) => c.implementado)
    if (filtro === 'FUERA_ALCANCE') return catalogo.filter((c) => !c.implementado)
    return catalogo
  }, [catalogo, filtro])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <AlertBanner variant="error" onClose={() => setError(null)}>
          {error}
        </AlertBanner>
      )}

      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-card">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Catálogo Regulatorio de Informes Normativos
          </h3>
          <p className="text-xs text-slate-500">
            Evaluación de cobertura de requerimientos de la ASFI, Banco Central de Bolivia y Ley N° 393
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFiltro('TODOS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${filtro === 'TODOS' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Todos ({catalogo.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('IMPLEMENTADOS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${filtro === 'IMPLEMENTADOS' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Implementados ({catalogo.filter((c) => c.implementado).length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('FUERA_ALCANCE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${filtro === 'FUERA_ALCANCE' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Fuera de Alcance ({catalogo.filter((c) => !c.implementado).length})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {filtrados.map((item) => {
          const esImplementado = Boolean(item.implementado)

          return (
            <div
              key={item.codigo}
              className={`p-5 rounded-xl border bg-white shadow-card transition-all ${esImplementado ? 'border-emerald-200/80 hover:border-emerald-300' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {item.codigo}
                    </span>
                    <Badge variant={esImplementado ? 'green' : 'slate'}>
                      {esImplementado ? 'Implementado' : 'Fuera de Alcance'}
                    </Badge>
                    {item.frecuencia && (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {item.frecuencia}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">
                    {item.nombre}
                  </h4>

                  {item.norma && (
                    <p className="text-xs text-slate-500 font-medium">
                      Normativa: <span className="text-slate-700">{item.norma}</span>
                    </p>
                  )}
                </div>

                {(item.fuente_url || item.url_fuente) && (
                  <a
                    href={item.fuente_url || item.url_fuente}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#006c49] hover:underline shrink-0 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                  >
                    <span>Fuente Primaria</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                )}
              </div>

              {/* Justificación o motivo para los que están fuera de alcance */}
              {item.motivo && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
                    shield_with_heart
                  </span>
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      Fundamento Normativo y Técnico:
                    </span>
                    <p className="mt-0.5 leading-relaxed text-slate-600">
                      {item.motivo}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
