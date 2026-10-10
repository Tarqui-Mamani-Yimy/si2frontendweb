import { useState, useRef, useEffect } from 'react'
import castorAvatar from '../../assets/screen copy.png'

const QUICK_PROMPTS = [
  '¿Cuál es la tasa de mora actual?',
  'Resumen de socios activos',
  'Estado de cierre de caja',
  'Políticas de crédito fiduciario',
]

export default function CastorChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'castor',
      text: '¡Hola! Soy Castor, tu copiloto financiero inteligente en NexaCoop. ¿En qué te puedo asesorar hoy?',
      time: 'Ahora',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  function handleSend(textToSend) {
    const text = textToSend || inputValue
    if (!text.trim()) return

    setMessages((prev) => {
      const userMsg = {
        id: prev.length + 1,
        sender: 'user',
        text: text.trim(),
        time: '',
      }
      return [...prev, userMsg]
    })
    if (!textToSend) setInputValue('')

    // Simulación UI instantánea de respuesta de Castor (sin llamadas a backend)
    setTimeout(() => {
      let replyText = 'Entendido. Estoy procesando tu consulta con los modelos fiduciarios de NexaCoop.'
      const lower = text.toLowerCase()
      if (lower.includes('mora')) {
        replyText = 'La mora global institucional se sitúa actualmente en 1.2%, cumpliendo con la meta de riesgo (< 2.5%).'
      } else if (lower.includes('socio') || lower.includes('miembro')) {
        replyText = 'Se registran 2,845 socios activos en el sistema, con 42 nuevos ingresos validados durante el ciclo actual.'
      } else if (lower.includes('caja') || lower.includes('cierre')) {
        replyText = 'Las operaciones de caja registran 148 transacciones hoy. El cierre programado está previsto para las 17:00.'
      } else if (lower.includes('crédito') || lower.includes('credito')) {
        replyText = 'La colocación asciende a $1.42M USD (94.2% de la meta mensual) con 98.8% de cartera sana.'
      }

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'castor',
          text: replyText,
          time: '',
        },
      ])
    }, 450)
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar panel de chat"
              className="p-1 rounded-lg text-emerald-100/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

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
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#064e3b] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p>{m.text}</p>
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
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 bg-white border-t border-[#e2e8f0]/80 overflow-x-auto flex gap-1.5 scrollbar-none">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="whitespace-nowrap text-[11px] font-medium text-[#006c49] bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200/60 transition-colors shrink-0"
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
              type="submit"
              disabled={!inputValue.trim()}
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
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Abrir Castor Asistente IA"
          className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#064e3b] p-1 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border border-[#04382a]"
        >
          <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#042c21]">
            <img
              src={castorAvatar}
              alt="Castor NexaCoop Mascot"
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
