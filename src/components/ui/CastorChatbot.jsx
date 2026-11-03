import { useState, useRef, useEffect, useCallback } from 'react'
import castorAvatar from '../../assets/screen copy.png'
import { descargarReporte, enviarMensaje, transcribirAudio } from '../../core/api/chatApi'
import { elegirFormatoAudio, mensajeErrorMicrofono, mensajeErrorTranscripcion } from './chatVoiceUtils'
import { FORMATO_REPORTE, descargasDeReporte } from './chatReporteUtils'

const QUICK_PROMPTS = [
  'Genera el reporte de morosidad en PDF',
  'Reporte de cartera en CSV',
  'Resumen de socios activos',
  'Estado de cierre de caja',
  '¿Cuál es la tasa de mora actual?',
]

const MAX_GRABACION_MS = 30000

const MENSAJE_INICIAL = {
  id: 0,
  sender: 'castor',
  text: '¡Hola! Soy Castor, tu copiloto financiero. Puedo darte información real de créditos, mora, socios, caja y precalificación, y generar reportes gerenciales y contables en PDF, CSV o HTML. ¿En qué te puedo asesorar hoy?',
  time: '',
}

function horaActual() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function CastorChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([MENSAJE_INICIAL])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState(QUICK_PROMPTS)
  const [downloadingId, setDownloadingId] = useState(null)
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const messagesEndRef = useRef(null)
  const recorderRef = useRef(null)
  const recordingTimeoutRef = useRef(null)
  const voiceSessionRef = useRef(0)
  const requestingMicRef = useRef(false)
  const handleSendRef = useRef(null)
  const nextId = useRef(1)
  const voiceInputSupported =
    typeof window !== 'undefined' &&
    'MediaRecorder' in window &&
    Boolean(window.navigator.mediaDevices?.getUserMedia)
  const speechSynthesisSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  // Invalidates the current dictation so nothing recorded so far gets sent.
  const cancelVoiceInput = useCallback(() => {
    voiceSessionRef.current += 1
    clearTimeout(recordingTimeoutRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    recorderRef.current = null
    setListening(false)
    setTranscribing(false)
  }, [])

  useEffect(() => () => {
    cancelVoiceInput()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [cancelVoiceInput])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, sending])

  const handleSend = useCallback(async (textToSend) => {
    const text = (textToSend ?? inputValue).trim()
    if (!text || sending) return

    const userMsg = { id: nextId.current++, sender: 'user', text, time: horaActual() }
    const historial = [...messages, userMsg]
      .filter((m) => m.text)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setSending(true)

    try {
      const data = await enviarMensaje(text, historial)
      if (speechEnabled && speechSynthesisSupported) {
        const utterance = new window.SpeechSynthesisUtterance(data.respuesta)
        utterance.lang = 'es-BO'
        utterance.onend = () => setVoiceStatus('Lectura de respuesta finalizada.')
        utterance.onerror = () => setVoiceStatus('No se pudo reproducir la respuesta de voz.')
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
        setVoiceStatus('Leyendo respuesta en voz alta.')
      }
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          sender: 'castor',
          text: data.respuesta,
          time: horaActual(),
          reporte: data.reporte ?? null,
        },
      ])
      if (Array.isArray(data.sugerencias) && data.sugerencias.length) {
        setSuggestions(data.sugerencias)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          sender: 'castor',
          text: 'No pude procesar tu consulta en este momento. Verifica tu conexión e inténtalo de nuevo.',
          time: horaActual(),
          error: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }, [inputValue, messages, sending, speechEnabled, speechSynthesisSupported])

  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  function closeChat() {
    cancelVoiceInput()
    setVoiceStatus('')
    if (speechSynthesisSupported) window.speechSynthesis.cancel()
    setOpen(false)
  }

  async function sendRecording(chunks, type, session) {
    const audio = new Blob(chunks, { type })
    if (!audio.size) {
      setVoiceStatus('No se detectó voz. Intenta hablar de nuevo.')
      return
    }

    setTranscribing(true)
    setVoiceStatus('Transcribiendo tu consulta…')
    try {
      const texto = await transcribirAudio(audio)
      if (session !== voiceSessionRef.current) return
      if (!texto) {
        setVoiceStatus('No se detectó voz. Intenta hablar de nuevo.')
        return
      }
      setInputValue(texto)
      setVoiceStatus('Consulta reconocida; enviándola a Castor…')
      handleSendRef.current?.(texto)
    } catch (error) {
      if (session === voiceSessionRef.current) setVoiceStatus(mensajeErrorTranscripcion(error))
    } finally {
      if (session === voiceSessionRef.current) setTranscribing(false)
    }
  }

  async function toggleVoiceInput() {
    if (listening) {
      clearTimeout(recordingTimeoutRef.current)
      recorderRef.current?.stop()
      return
    }
    if (requestingMicRef.current) return

    if (!voiceInputSupported) {
      setVoiceStatus('El dictado por voz no está disponible en este navegador.')
      return
    }

    const session = ++voiceSessionRef.current
    requestingMicRef.current = true
    let stream
    try {
      stream = await window.navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      if (session === voiceSessionRef.current) setVoiceStatus(mensajeErrorMicrofono(error))
      return
    } finally {
      requestingMicRef.current = false
    }

    const stopStream = () => stream.getTracks().forEach((track) => track.stop())
    if (session !== voiceSessionRef.current) {
      stopStream()
      return
    }

    try {
      const formato = elegirFormatoAudio((tipo) => window.MediaRecorder.isTypeSupported(tipo))
      const recorder = new window.MediaRecorder(stream, formato ? { mimeType: formato } : undefined)
      const chunks = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.onstop = () => {
        stopStream()
        if (session !== voiceSessionRef.current) return
        recorderRef.current = null
        setListening(false)
        sendRecording(chunks, recorder.mimeType || formato, session)
      }
      recorderRef.current = recorder
      recorder.start()
      setListening(true)
      setVoiceStatus('Escuchando… Pulsa el micrófono para terminar.')
      recordingTimeoutRef.current = setTimeout(() => recorder.stop(), MAX_GRABACION_MS)
    } catch {
      stopStream()
      recorderRef.current = null
      setListening(false)
      setVoiceStatus('No se pudo iniciar el micrófono. Intenta de nuevo.')
    }
  }

  function toggleSpeechOutput() {
    if (!speechSynthesisSupported) {
      setVoiceStatus('La lectura en voz alta no está disponible en este navegador.')
      return
    }
    setSpeechEnabled((enabled) => {
      const nextEnabled = !enabled
      if (!nextEnabled) {
        window.speechSynthesis.cancel()
        setVoiceStatus('Lectura en voz alta desactivada.')
      } else {
        setVoiceStatus('Las próximas respuestas se leerán en voz alta.')
      }
      return nextEnabled
    })
  }

  async function handleDescargarReporte(message, descarga) {
    if (!descarga || downloadingId) return
    const formato = FORMATO_REPORTE[descarga.formato]?.label ?? 'reporte'
    setDownloadingId(`${message.id}:${descarga.formato}`)
    try {
      await descargarReporte(descarga)
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          sender: 'castor',
          text: error?.message
            ? `No pude descargar el ${formato}: ${error.message}. Inténtalo desde el módulo de reportes.`
            : `No pude descargar el ${formato} en este momento. Inténtalo desde el módulo de reportes.`,
          time: horaActual(),
          error: true,
        },
      ])
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── Ventana del Chat Panel ── */}
      {open && (
        <div className="mb-3 w-[360px] sm:w-[400px] h-[520px] max-h-[80vh] flex flex-col rounded-2xl bg-white border border-[#e2e8f0] shadow-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-[#064e3b] px-4 py-3.5 text-white flex items-center justify-between border-b border-[#04382a]">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 rounded-full bg-[#042c21] p-0.5 overflow-hidden border border-emerald-400/40">
                <img
                  src={castorAvatar}
                  alt="Castor Asistente IA"
                  className="w-full h-full object-cover rounded-full"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#6ffbbe] border border-[#064e3b]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-white leading-tight">Castor Asistente IA</h3>
                  <span className="bg-[#6cf8bb]/20 text-[#6ffbbe] text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">Core</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">Ecosistema Fiduciario Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSpeechOutput}
                disabled={!speechSynthesisSupported}
                aria-label={speechEnabled ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
                aria-pressed={speechEnabled}
                title={
                  speechSynthesisSupported
                    ? 'Alternar lectura en voz alta'
                    : 'Lectura en voz alta no disponible en este navegador'
                }
                className="p-1 rounded-lg text-emerald-100/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {speechEnabled ? 'volume_up' : 'volume_off'}
                </span>
              </button>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Cerrar panel de chat"
                className="p-1 rounded-lg text-emerald-100/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {voiceStatus && (
            <p className="px-4 py-1.5 bg-emerald-50 text-[11px] text-emerald-800" aria-live="polite">
              {voiceStatus}
            </p>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9ff]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'castor' && (
                  <div className="h-7 w-7 rounded-full bg-[#064e3b] p-0.5 shrink-0 overflow-hidden border border-emerald-500/20">
                    <img src={castorAvatar} alt="Castor" className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-[#064e3b] text-white rounded-tr-xs shadow-xs'
                      : m.error
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-xs shadow-xs'
                        : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.reporte && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {descargasDeReporte(m.reporte).map((descarga, index) => {
                        const meta = FORMATO_REPORTE[descarga.formato]
                        const key = `${m.id}:${descarga.formato}`
                        // The first link is the format the user asked for.
                        const pedido = index === 0
                        return (
                          <button
                            key={descarga.formato}
                            type="button"
                            onClick={() => handleDescargarReporte(m, descarga)}
                            disabled={Boolean(downloadingId)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                              pedido
                                ? 'bg-[#006c49] text-white hover:bg-[#0c4f30]'
                                : 'border border-[#006c49]/30 bg-white text-[#006c49] hover:bg-emerald-50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {downloadingId === key ? 'hourglass_top' : meta.icon}
                            </span>
                            {downloadingId === key ? 'Generando…' : pedido ? `Descargar ${meta.label}` : meta.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <span
                    className={`block mt-1 text-[10px] text-right ${
                      m.sender === 'user' ? 'text-emerald-200/70' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-7 w-7 rounded-full bg-[#064e3b] p-0.5 shrink-0 overflow-hidden border border-emerald-500/20">
                  <img src={castorAvatar} alt="Castor" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="bg-white border border-[#e2e8f0] rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 bg-white border-t border-[#e2e8f0]/80 overflow-x-auto flex gap-1.5 scrollbar-none">
            {suggestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={sending}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap text-[11px] font-medium text-[#006c49] bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200/60 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input & Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-white border-t border-[#e2e8f0] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Consulta a Castor IA..."
              className="flex-1 h-9 px-3 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none transition"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={sending || transcribing}
              aria-label={listening ? 'Detener dictado por voz' : 'Dictar consulta por voz'}
              aria-pressed={listening}
              title={
                voiceInputSupported
                  ? 'Dictar consulta en español'
                  : 'Dictado por voz no disponible en este navegador'
              }
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                listening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-emerald-100 text-[#064e3b] hover:bg-emerald-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {transcribing ? 'hourglass_top' : listening ? 'mic_off' : 'mic'}
              </span>
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              aria-label="Enviar mensaje"
              className="h-9 w-9 rounded-lg bg-[#064e3b] text-white flex items-center justify-center hover:bg-[#0c4f30] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Botón Flotante Launcher ── */}
      <div className="flex items-center gap-2 group">
        {!open && (
          <div
            onClick={() => setOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white text-[#0b1c30] px-3.5 py-1.5 rounded-full shadow-md border border-[#e2e8f0] transition-all duration-300 transform group-hover:scale-105 cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="text-xs font-medium text-slate-700">
              ¿Consultas o reportes?{' '}
              <strong className="text-[#064e3b] font-semibold">Pregúntale a Castor IA</strong>
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#006c49]">auto_awesome</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => (open ? closeChat() : setOpen(true))}
          aria-label="Abrir Castor Asistente IA"
          className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#064e3b] p-1 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border border-[#04382a]"
        >
          <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#042c21]">
            <img
              src={castorAvatar}
              alt="Castor Mascot"
              className="w-full h-full object-cover pointer-events-none rounded-full"
            />
          </div>
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ffbbe] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#006c49] border-2 border-white" />
          </span>
        </button>
      </div>
    </div>
  )
}
