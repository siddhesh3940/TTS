import React, { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B'  },
  { id: 'gemma2-9b-it',            label: 'Gemma 2 9B'    },
]

export default function ChatWidget() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your SoundStudio AI assistant. Ask me anything about TTS, voice cloning, or anything else!' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel]     = useState(MODELS[0].id)
  const bottomRef             = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter(m => m.role !== 'assistant' || history.indexOf(m) > 0), model }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.detail }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ Failed to reach the server.' }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <>
      {/* Floating button */}
      <button className="chat-fab" onClick={() => setOpen(o => !o)} title="AI Assistant">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>🤖 AI Assistant</span>
            <select
              className="chat-model-select"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="chat-bubble assistant chat-typing"><span /><span /><span /></div>}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Ask anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}
