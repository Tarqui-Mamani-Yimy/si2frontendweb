import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../../../components/ui/Button'
import Modal from '../../../../components/ui/Modal'
import AlertBanner from '../../../../components/ui/AlertBanner'
import { exportReporte, interpretarComandoVoz } from '../../../../core/api/reportesApi'
import { getApiErrorMessage } from '../../../../core/api/errors'
import {
  FORMATOS_REPORTE,
  blobErrorMessage,
  filenameFromDisposition,
  getSpeechRecognition,
  joinTranscript,
  speechErrorMessage,
} from './comandoVozUtils'

const EJEMPLOS = [
  'Reporte de cartera en PDF',
  'Descarga la morosidad del mes pasado en CSV',
  'Captaciones en dólares al 30 de septiembre en HTML',
  'Libro diario de este mes en PDF',
]

function speak(text) {
  const synth = globalThis.speechSynthesis
  if (!synth || !text) return
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-ES'
  synth.speak(utterance)
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Botón "Comando de voz" del apartado Reportes: escucha un comando hablado,
 * lo interpreta en el backend y devuelve el reporte con vista previa y
 * apertura/descarga en PDF, CSV o HTML.
 */
export default function ComandoVozReportes({ onReport }) {
  const [open, setOpen] = useState(false)
  // idle | listening | processing | result | error
  const [phase, setPhase] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [busy, setBusy] = useState(null) // `${accion}:${formato}`
  const [fileError, setFileError] = useState(null)

  const recognitionRef = useRef(null)
  const filesRef = useRef({})
  const commandIdRef = useRef(0)
  const supported = Boolean(getSpeechRecognition())

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      recognition.onresult = recognition.onerror = recognition.onend = null
      recognition.abort()
    }
  }, [])

  useEffect(() => stopListening, [stopListening])

  const getFile = useCallback(async (command, formato) => {
    const cached = filesRef.current[formato]
    if (cached) return cached
    const response = await exportReporte(command.endpoint, command.parametros, formato)
    const file = {
      blob: response.data,
      filename: filenameFromDisposition(
        response.headers?.['content-disposition'],
        `${command.archivo}.${formato}`,
      ),
    }
    filesRef.current[formato] = file
    return file
  }, [])

  const download = useCallback(async (command, formato) => {
    setBusy(`descargar:${formato}`)
    setFileError(null)
    try {
      const { blob, filename } = await getFile(command, formato)
      saveBlob(blob, filename)
    } catch (err) {
      setFileError(await blobErrorMessage(err, `No se pudo generar el ${formato.toUpperCase()}.`))
    } finally {
      setBusy(null)
    }
  }, [getFile])

  const processCommand = useCallback(async (texto) => {
    const clean = texto.trim()
    if (!clean) return
    const commandId = ++commandIdRef.current
    stopListening()
    filesRef.current = {}
    setTranscript(clean)
    setPhase('processing')
    setMessage(null)
    setSuggestions([])
    setResult(null)
    setPreviewHtml('')
    setFileError(null)

    let command
    try {
      command = await interpretarComandoVoz(clean)
    } catch (err) {
      if (commandId !== commandIdRef.current) return
      setPhase('error')
      setMessage(getApiErrorMessage(err, 'No se pudo interpretar el comando.'))
      return
    }
    if (commandId !== commandIdRef.current) return

    if (!command.reconocido) {
      setPhase('error')
      setMessage(command.mensaje)
      setSuggestions(command.sugerencias ?? [])
      speak(command.mensaje)
      return
    }

    setResult(command)
    setPhase('result')
    onReport?.(command)
    speak(`${command.accion === 'descargar' ? 'Descargando' : 'Mostrando'} ${command.nombre}`)

    if (command.accion === 'descargar') {
      download(command, command.formato ?? 'pdf')
    }

    setPreviewLoading(true)
    try {
      const { blob } = await getFile(command, 'html')
      const html = await blob.text()
      if (commandId === commandIdRef.current) setPreviewHtml(html)
    } catch (err) {
      if (commandId === commandIdRef.current) {
        setFileError(await blobErrorMessage(err, 'No se pudo generar la vista previa del reporte.'))
      }
    } finally {
      if (commandId === commandIdRef.current) setPreviewLoading(false)
    }
  }, [download, getFile, onReport, stopListening])

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) return
    stopListening()
    globalThis.speechSynthesis?.cancel()
    let heard = ''
    const recognition = new Recognition()
    recognition.lang = 'es-BO'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      heard = joinTranscript(event.results)
      setTranscript(heard)
    }
    recognition.onerror = (event) => {
      const text = speechErrorMessage(event.error)
      if (text) {
        setPhase('error')
        setMessage(text)
        setSuggestions([])
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
      if (heard) {
        processCommand(heard)
      } else {
        setPhase((current) => (current === 'listening' ? 'idle' : current))
      }
    }
    recognitionRef.current = recognition
    setTranscript('')
    setMessage(null)
    setSuggestions([])
    setPhase('listening')
    try {
      recognition.start()
    } catch {
      setPhase('error')
      setMessage(speechErrorMessage('unknown'))
    }
  }, [processCommand, stopListening])

  function handleOpenModal() {
    setOpen(true)
    setResult(null)
    setPreviewHtml('')
    setMessage(null)
    setSuggestions([])
    setTranscript('')
    setPhase('idle')
    // Start right away: the click is the user gesture the microphone prompt needs.
    if (supported) startListening()
  }

  function handleClose() {
    commandIdRef.current += 1
    stopListening()
    globalThis.speechSynthesis?.cancel()
    setOpen(false)
  }

  async function handleOpenFile(formato) {
    // Open the tab synchronously (still inside the click) so popup blockers allow it.
    const win = globalThis.open('', '_blank')
    setBusy(`abrir:${formato}`)
    setFileError(null)
    try {
      const { blob } = await getFile(result, formato)
      const type = FORMATOS_REPORTE.find((f) => f.id === formato)?.openType ?? blob.type
      const url = URL.createObjectURL(new Blob([blob], { type }))
      if (win) {
        win.location.href = url
      } else {
        globalThis.open(url, '_blank')
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      win?.close()
      setFileError(await blobErrorMessage(err, `No se pudo abrir el ${formato.toUpperCase()}.`))
    } finally {
      setBusy(null)
    }
  }

  function handleTypedSubmit(event) {
    event.preventDefault()
    processCommand(typed)
    setTyped('')
  }

  const listening = phase === 'listening'

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleOpenModal}
        className="gap-1.5"
        title="Pedir un reporte por voz"
      >
        <span className="material-symbols-outlined text-[17px]">mic</span>
        <span>Comando de voz</span>
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        size="lg"
        title="Reportes por comando de voz"
        subtitle="Di qué reporte necesitas, el período, la moneda y el formato (PDF, CSV o HTML)."
      >
        <div className="space-y-4 text-sm">
          {/* Micrófono y transcripción */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <button
              type="button"
              // stop() (not abort) still fires onend, so what was heard gets processed.
              onClick={listening ? () => recognitionRef.current?.stop() : startListening}
              disabled={!supported || phase === 'processing'}
              aria-label={listening ? 'Detener escucha' : 'Hablar'}
              className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                listening ? 'bg-red-600 hover:bg-red-700' : 'bg-[#064e3b] hover:bg-[#0c4f30]'
              }`}
            >
              {listening && (
                <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" aria-hidden="true" />
              )}
              <span className="material-symbols-outlined relative text-[30px]">
                {listening ? 'stop' : 'mic'}
              </span>
            </button>

            <div className="min-w-0 flex-1 text-center sm:text-left" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {!supported && 'Tu navegador no admite dictado por voz'}
                {supported && phase === 'idle' && 'Pulsa el micrófono y habla'}
                {listening && 'Escuchando…'}
                {phase === 'processing' && 'Interpretando el comando…'}
                {phase === 'result' && 'Comando entendido'}
                {phase === 'error' && 'No se pudo completar el comando'}
              </p>
              <p className="mt-1 min-h-[1.5rem] break-words text-base font-medium text-[#0b1c30]">
                {transcript ? `“${transcript}”` : (
                  <span className="text-slate-400">
                    Ej.: «{EJEMPLOS[0]}»
                  </span>
                )}
              </p>
              {!supported && (
                <p className="mt-1 text-xs text-slate-500">
                  Usa Chrome o Edge para hablar, o escribe el comando abajo.
                </p>
              )}
            </div>
          </div>

          {/* Escribir el comando (alternativa sin micrófono) */}
          <form onSubmit={handleTypedSubmit} className="flex gap-2">
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="…o escribe el comando, p. ej. «balance general del año pasado en PDF»"
              aria-label="Escribir comando de reporte"
              maxLength={500}
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-[#006c49]"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={!typed.trim() || phase === 'processing'}>
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Enviar</span>
            </Button>
          </form>

          {phase === 'processing' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Preparando el reporte…
            </div>
          )}

          {phase === 'error' && message && (
            <div className="space-y-2">
              <AlertBanner variant="error">{message}</AlertBanner>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => processCommand(suggestion)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-[#064e3b] transition hover:bg-emerald-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {phase === 'idle' && !transcript && (
            <div className="flex flex-wrap gap-1.5">
              {EJEMPLOS.map((ejemplo) => (
                <button
                  key={ejemplo}
                  type="button"
                  onClick={() => processCommand(ejemplo)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-emerald-300 hover:text-[#064e3b]"
                >
                  {ejemplo}
                </button>
              ))}
            </div>
          )}

          {/* Resultado */}
          {phase === 'result' && result && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="font-bold text-[#064e3b]">{result.nombre}</p>
                <p className="text-xs text-slate-600">{result.descripcion}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FORMATOS_REPORTE.map((formato) => {
                  const pedido = result.formato === formato.id
                  return (
                    <div
                      key={formato.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border p-2 ${
                        pedido ? 'border-[#064e3b] bg-emerald-50/50' : 'border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30]">
                        <span className="material-symbols-outlined text-[18px] text-[#064e3b]">{formato.icon}</span>
                        {formato.label}
                        {pedido && <span className="font-normal text-[#064e3b]">· pedido</span>}
                      </span>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="!px-2"
                          loading={busy === `abrir:${formato.id}`}
                          disabled={Boolean(busy)}
                          onClick={() => handleOpenFile(formato.id)}
                          title={`Abrir ${formato.label} en una pestaña nueva`}
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          <span>Abrir</span>
                        </Button>
                        <Button
                          type="button"
                          variant={pedido ? 'primary' : 'secondary'}
                          size="sm"
                          className="!px-2"
                          loading={busy === `descargar:${formato.id}`}
                          disabled={Boolean(busy)}
                          onClick={() => download(result, formato.id)}
                          title={`Descargar ${formato.label}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>Descargar</span>
                        </Button>
                      </span>
                    </div>
                  )
                })}
              </div>

              {fileError && (
                <AlertBanner variant="error" dismissible onDismiss={() => setFileError(null)}>
                  {fileError}
                </AlertBanner>
              )}

              {(previewLoading || previewHtml) && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {previewLoading ? (
                    <div className="flex h-72 items-center justify-center gap-2 text-xs text-slate-500">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Generando vista previa…
                    </div>
                  ) : (
                    // Empty sandbox: the report renders but can run no scripts.
                    <iframe
                      title={`Vista previa: ${result.nombre}`}
                      srcDoc={previewHtml}
                      sandbox=""
                      className="h-[50vh] w-full bg-white"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
