export const FORMATO_REPORTE = {
  pdf: { label: 'PDF', icon: 'picture_as_pdf' },
  csv: { label: 'CSV', icon: 'table_view' },
  html: { label: 'HTML', icon: 'html' },
}

/**
 * Enlaces de descarga de un reporte del chatbot, el formato pedido primero.
 * Acepta la respuesta antigua del backend (solo `url`/`filename`, siempre PDF).
 */
export function descargasDeReporte(reporte) {
  if (!reporte) return []
  if (Array.isArray(reporte.descargas) && reporte.descargas.length > 0) {
    return reporte.descargas.filter((d) => d?.url && FORMATO_REPORTE[d.formato])
  }
  if (!reporte.url) return []
  return [{ formato: reporte.formato ?? 'pdf', url: reporte.url, filename: reporte.filename }]
}
