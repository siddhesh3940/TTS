import React, { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
  { label: 'English (US)',       code: 'en-US' },
  { label: 'English (UK)',       code: 'en-GB' },
  { label: 'Hindi',              code: 'hi-IN' },
  { label: 'Tamil',              code: 'ta-IN' },
  { label: 'Telugu',             code: 'te-IN' },
  { label: 'Bengali',            code: 'bn-IN' },
  { label: 'Marathi',            code: 'mr-IN' },
  { label: 'Gujarati',           code: 'gu-IN' },
  { label: 'Kannada',            code: 'kn-IN' },
  { label: 'Malayalam',          code: 'ml-IN' },
  { label: 'Spanish',            code: 'es-ES' },
  { label: 'French',             code: 'fr-FR' },
  { label: 'German',             code: 'de-DE' },
  { label: 'Italian',            code: 'it-IT' },
  { label: 'Portuguese (BR)',    code: 'pt-BR' },
  { label: 'Japanese',           code: 'ja-JP' },
  { label: 'Chinese (Mandarin)', code: 'zh-CN' },
  { label: 'Korean',             code: 'ko-KR' },
  { label: 'Arabic',             code: 'ar-SA' },
  { label: 'Russian',            code: 'ru-RU' },
]

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const supported = !!SpeechRecognition

export default function SpeechToText() {
  const [lang, setLang]           = useState('en-US')
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim]     = useState('')
  const [error, setError]         = useState('')
  const [continuous, setContinuous] = useState(true)
  const recogRef = useRef(null)

  useEffect(() => () => recogRef.current?.stop(), [])

  const start = () => {
    if (!supported) return
    setError('')
    const r = new SpeechRecognition()
    r.lang = lang
    r.continuous = continuous
    r.interimResults = true

    r.onresult = (e) => {
      let final = ''
      let inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else inter += t
      }
      if (final) setTranscript(prev => prev + final)
      setInterim(inter)
    }

    r.onerror = (e) => {
      setError(e.error === 'not-allowed'
        ? 'Microphone access denied. Please allow microphone in your browser.'
        : `Recognition error: ${e.error}`)
      setListening(false)
    }

    r.onend = () => {
      setInterim('')
      setListening(false)
    }

    recogRef.current = r
    r.start()
    setListening(true)
  }

  const stop = () => {
    recogRef.current?.stop()
    setListening(false)
    setInterim('')
  }

  const clear = () => { setTranscript(''); setInterim(''); setError('') }

  const copy = () => navigator.clipboard.writeText(transcript)

  const download = () => {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'transcript.txt'
    a.click()
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const charCount = transcript.length

  return (
    <>
      <div className="topbar">
        <span className="topbar-label">Speech to Text</span>
        <div className="topbar-actions">
          <span className="badge badge-orange">🎙️ Web Speech API · Live</span>
        </div>
      </div>

      {!supported && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          Your browser does not support the Web Speech API. Please use Chrome or Edge.
        </div>
      )}

      <div className="tts-layout">

        {/* ── Left panel ── */}
        <aside className="tts-panel">
          <span className="panel-title">Settings</span>

          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              className="form-select"
              value={lang}
              onChange={e => setLang(e.target.value)}
              disabled={listening}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mode</label>
            <div className="stt-mode-row">
              <button
                className={`stt-mode-btn${continuous ? ' active' : ''}`}
                onClick={() => setContinuous(true)}
                disabled={listening}
              >
                Continuous
              </button>
              <button
                className={`stt-mode-btn${!continuous ? ' active' : ''}`}
                onClick={() => setContinuous(false)}
                disabled={listening}
              >
                Single phrase
              </button>
            </div>
            <p className="stt-mode-hint">
              {continuous
                ? 'Keeps recording until you press Stop.'
                : 'Stops automatically after one phrase.'}
            </p>
          </div>

          <div className="divider" />
          <span className="panel-title">Stats</span>

          <div className="stt-stats">
            <div className="stt-stat">
              <span className="stt-stat-val">{wordCount.toLocaleString()}</span>
              <span className="stt-stat-label">words</span>
            </div>
            <div className="stt-stat">
              <span className="stt-stat-val">{charCount.toLocaleString()}</span>
              <span className="stt-stat-label">characters</span>
            </div>
          </div>

          <div className="divider" />
          <span className="panel-title">How it works</span>
          <ul className="stt-tips">
            <li>Uses your browser's built-in speech recognition</li>
            <li>No audio is sent to any server</li>
            <li>Works best in Chrome or Edge</li>
            <li>Speak clearly, close to the mic</li>
          </ul>
        </aside>

        {/* ── Right panel ── */}
        <div className="tts-main">
          <div className="stt-toolbar">
            <span className="panel-title">Transcript</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={copy}
                disabled={!transcript}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={download}
                disabled={!transcript}
                title="Download as .txt"
              >
                ⬇ TXT
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={clear}
                disabled={!transcript && !interim}
                title="Clear transcript"
              >
                🗑 Clear
              </button>
            </div>
          </div>

          {/* Transcript display */}
          <div className={`stt-output${listening ? ' stt-output-active' : ''}`}>
            {transcript || interim
              ? <>
                  <span className="stt-final">{transcript}</span>
                  {interim && <span className="stt-interim">{interim}</span>}
                </>
              : <span className="stt-placeholder">
                  {listening
                    ? 'Listening… start speaking'
                    : 'Press the microphone button below to start transcribing'}
                </span>
            }
          </div>

          {error && (
            <div className="alert alert-error">⚠ {error}</div>
          )}

          {/* Record button */}
          <div className="stt-record-row">
            <button
              className={`stt-record-btn${listening ? ' recording' : ''}`}
              onClick={listening ? stop : start}
              disabled={!supported}
              title={listening ? 'Stop recording' : 'Start recording'}
            >
              <span className="stt-record-icon">{listening ? '⏹' : '🎙️'}</span>
              <span>{listening ? 'Stop Recording' : 'Start Recording'}</span>
              {listening && <span className="stt-pulse" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
