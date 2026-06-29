import React, { useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VoiceClone() {
  const [text, setText]         = useState('')
  const [file, setFile]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [audioUrl, setAudioUrl] = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const clone = async () => {
    if (!text.trim()) { setError('Please enter some text.'); return }
    if (!file)        { setError('Please upload a reference audio file.'); return }
    setError('')
    setAudioUrl(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('text', text)
      form.append('file', file)
      const res = await fetch(`${API}/api/clone`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Clone failed')
      }
      const blob = await res.blob()
      setAudioUrl(URL.createObjectURL(blob))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = 'cloned_speech.wav'
    a.click()
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-label">Voice Cloning</span>
        <div className="topbar-actions">
          <span className="badge badge-orange">🎤 OpenVoice V2</span>
        </div>
      </div>

      <div className="tts-layout">

        {/* Left — Upload */}
        <aside className="tts-panel">
          <span className="panel-title">Reference Voice</span>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>
            Upload a clear audio sample of the voice you want to clone (WAV or MP3, 6–30 seconds recommended).
          </p>

          <div
            className="drop-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            {file ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🎤</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                  Drag & drop or <span style={{ color: 'var(--accent)' }}>browse</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>WAV, MP3, M4A</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFile} />

          {file && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => { setFile(null); setAudioUrl(null) }}
            >
              ✕ Remove
            </button>
          )}

          <div className="divider" style={{ margin: '20px 0' }} />

          <span className="panel-title">Tips</span>
          <ul style={{ fontSize: 12, color: 'var(--text-faint)', paddingLeft: 16, lineHeight: 2 }}>
            <li>Use a clean recording with no background noise</li>
            <li>6–30 seconds gives the best results</li>
            <li>Single speaker only</li>
            <li>WAV format preferred</li>
          </ul>
        </aside>

        {/* Right — Text + Output */}
        <div className="tts-main">
          <span className="panel-title">Script</span>

          <textarea
            className="tts-textarea"
            placeholder="Enter the text you want spoken in the cloned voice…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="tts-char-count">{text.length.toLocaleString()} characters</div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <button
            className="btn btn-primary btn-full"
            onClick={clone}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Cloning voice…</>
              : '🎤 Clone & Generate'}
          </button>

          {loading && (
            <div className="alert" style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>
              ⏳ Cloning voice using OpenVoice V2. This may take 20–60 seconds on first run.
            </div>
          )}

          {audioUrl && (
            <div className="audio-section">
              <span className="audio-label">🎧 Cloned Output</span>
              <audio controls src={audioUrl} style={{ width: '100%', marginTop: 8 }} />
              <div className="download-row" style={{ marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={download}>
                  ⬇ Download WAV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
