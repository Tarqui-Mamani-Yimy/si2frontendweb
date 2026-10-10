/**
 * Helper to safely extract and format error messages returned by API endpoints.
 * Handles FastAPI / Pydantic validation errors (where detail is an array of {loc, msg, type})
 * as well as plain string details or fallback messages.
 *
 * @param {any} err - Axios error or exception object.
 * @param {string} [fallback='Ha ocurrido un error inesperado.'] - Fallback message if detail is absent.
 * @returns {string} Safe string message to render in React.
 */
export function getApiErrorMessage(err, fallback = 'Ha ocurrido un error inesperado.') {
  const detail = err?.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item.replace(/^Value error,\s*/i, '').trim()
        }
        if (item && typeof item === 'object' && item.msg) {
          return String(item.msg).replace(/^Value error,\s*/i, '').trim()
        }
        return ''
      })
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join('; ')
    }
  }

  return fallback
}
