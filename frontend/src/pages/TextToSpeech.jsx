import React, { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

export default function TextToSpeech() {
  const [voiceDB, setVoiceDB]       = useState({})
  const [language, setLanguage]     = useState('')
  const [region, setRegion]         = useState('')
  const [gender, setGender]         = useState('')
  const [voiceName, setVoiceName]   = useState('')
  const [voiceCode, setVoiceCode]   = useState('')

  const [rate, setRate]     = useState(0)
  const [pitch, setPitch]   = useState(0)
  const [volume, setVolume] = useState(0)

  const [text, setText]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState(null)   // { audio_url, vtt, srt }
  const [showCaptions, setShowCaptions] = useState(false)

  /* Fetch voice DB on mount */
  useEffect(() => {
    fetch(`${API}/api/voices`)
      .then(r => r.json())
      .then(db => {
        setVoiceDB(db)
        const lang = Object.keys(db).sort()[0]
        setLanguage(lang)
      })
      .catch(() => setError('Cannot reach backend. Is uvicorn running on port 8000?'))
  }, [])

  /* Cascade selects */
  useEffect(() => {
    if (!voiceDB[language]) return
    const reg = Object.keys(voiceDB[language]).sort()[0]
    setRegion(reg)
  }, [language, voiceDB])

  useEffect(() => {
    if (!voiceDB[language]?.[region]) return
    const gen = Object.keys(voiceDB[language][region]).sort()[0]
    setGender(gen)
  }, [language, region, voiceDB])

  useEffect(() => {
    if (!voiceDB[language]?.[region]?.[gender]) return
    const voices = voiceDB[language][region][gender]
    const name = Object.keys(voices)[0]
    setVoiceName(name)
    setVoiceCode(voices[name])
  }, [language, region, gender, voiceDB])

  const handleVoiceName = (name) => {
    setVoiceName(name)
    setVoiceCode(voiceDB[language][region][gender][name])
  }

  const generate = async () => {
    if (!text.trim()) { setError('Please enter some text.'); return }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_code: voiceCode, rate, pitch, volume }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Unknown error')
      setResult({ ...data, audio_url: `${API}${data.audio_url}?t=${Date.now()}` })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (url, filename, type) => {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }

  const downloadText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }

  const languages = Object.keys(voiceDB).sort()
  const regions   = voiceDB[language] ? Object.keys(voiceDB[language]).sort() : []
  const genders   = voiceDB[language]?.[region] ? Object.keys(voiceDB[language][region]).sort() : []
  const voices    = voiceDB[language]?.[region]?.[gender] ? Object.keys(voiceDB[language][region][gender]) : []

  return (
    <>
      <div className="topbar">
        <span className="topbar-label">Text to Speech</span>
        <div className="topbar-actions">
          <span className="badge badge-orange">🎙️ Edge TTS · Neural</span>
        </div>
      </div>

      <div className="tts-layout">

        {/* ── Left panel: Voice settings ─────────────────────────────────── */}
        <aside className="tts-panel">
          <span className="panel-title">Voice Settings</span>

          <div className="form-group">
            <label className="form-label">Language</label>
            <select id="sel-language" className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Region</label>
            <select id="sel-region" className="form-select" value={region} onChange={e => setRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select id="sel-gender" className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Voice</label>
            <select id="sel-voice" className="form-select" value={voiceName} onChange={e => handleVoiceName(e.target.value)}>
              {voices.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {voiceCode && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
              {voiceCode}
            </div>
          )}

          <div className="divider" />
          <span className="panel-title">Audio Controls</span>

          {[
            { label: 'Speed',  value: rate,   set: setRate,   min: -50, max: 100, unit: '%' },
            { label: 'Pitch',  value: pitch,  set: setPitch,  min: -50, max: 50,  unit: 'Hz' },
            { label: 'Volume', value: volume, set: setVolume, min: -50, max: 50,  unit: '%' },
          ].map(({ label, value, set, min, max, unit }) => (
            <div key={label} className="slider-row">
              <span className="slider-label">{label}</span>
              <input
                id={`slider-${label.toLowerCase()}`}
                type="range"
                min={min} max={max} step={5}
                value={value}
                onChange={e => set(Number(e.target.value))}
              />
              <span className="slider-value">{value > 0 ? '+' : ''}{value}{unit}</span>
            </div>
          ))}
        </aside>

        {/* ── Right panel: Script + output ───────────────────────────────── */}
        <div className="tts-main">
          <span className="panel-title">Script</span>

          <textarea
            id="tts-textarea"
            className="tts-textarea"
            placeholder="Type or paste your text here…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="tts-char-count">{text.length.toLocaleString()} characters</div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <button
            id="btn-generate"
            className="btn btn-primary btn-full"
            onClick={generate}
            disabled={loading || !voiceCode}
          >
            {loading ? <><span className="spinner" /> Generating…</> : '🎤 Generate Speech'}
          </button>

          {result && (
            <div className="audio-section">
              <span className="audio-label">
                🎧 Output · {voiceName} · {language} ({region}) · {gender}
              </span>

              <audio id="audio-player" controls src={result.audio_url} />

              <div className="download-row">
                <button
                  id="btn-dl-mp3"
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadFile(result.audio_url, 'speech.mp3', 'audio/mpeg')}
                >
                  ⬇ MP3
                </button>
                {result.vtt && (
                  <button
                    id="btn-dl-vtt"
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadText(result.vtt, 'subtitles.vtt')}
                  >
                    ⬇ VTT
                  </button>
                )}
                {result.srt && (
                  <button
                    id="btn-dl-srt"
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadText(result.srt, 'subtitles.srt')}
                  >
                    ⬇ SRT
                  </button>
                )}
                {result.srt && (
                  <button
                    id="btn-captions"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowCaptions(v => !v)}
                  >
                    {showCaptions ? 'Hide' : 'Preview'} Captions
                  </button>
                )}
              </div>

              {showCaptions && result.srt && (
                <pre className="captions-box">{result.srt}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
