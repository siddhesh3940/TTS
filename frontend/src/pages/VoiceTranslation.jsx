import React, { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LANG_FLAGS = {
  English: '🇺🇸', Hindi: '🇮🇳', Tamil: '🇮🇳', Telugu: '🇮🇳', Bengali: '🇧🇩',
  Marathi: '🇮🇳', Gujarati: '🇮🇳', Kannada: '🇮🇳', Malayalam: '🇮🇳', Urdu: '🇵🇰',
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹', Portuguese: '🇧🇷',
  Japanese: '🇯🇵', Chinese: '🇨🇳', Korean: '🇰🇷', Arabic: '🇸🇦', Russian: '🇷🇺',
  Dutch: '🇳🇱', Turkish: '🇹🇷', Polish: '🇵🇱', Swedish: '🇸🇪', Indonesian: '🇮🇩',
}

const STEPS = [
  { icon: '🎙️', label: 'Upload audio',        desc: 'Any language, WAV or MP3' },
  { icon: '🌐', label: 'Pick target language', desc: '25 languages supported'   },
  { icon: '✨', label: 'SeamlessM4T translates', desc: 'Speech → speech, Meta AI' },
  { icon: '🎤', label: 'Voice cloned output',  desc: 'Same accent, new language' },
]

export default function VoiceTranslation() {
  const [languages, setLanguages]   = useState([])
  const [targetLang, setTargetLang] = useState('Hindi')
  const [file, setFile]             = useState(null)
  const [cloneVoice, setCloneVoice] = useState(true)
  const [loading, setLoading]       = useState(false)
  const [stage, setStage]           = useState('')   // progress message
  const [error, setError]           = useState('')
  const [audioUrl, setAudioUrl]     = useState(null)
  const [originalUrl, setOriginalUrl] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    fetch(`${API}/api/translate/languages`)
      .then(r => r.json())
      .then(d => setLanguages(d.languages))
      .catch(() => setLanguages(Object.keys(LANG_FLAGS)))
  }, [])

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setAudioUrl(null)
    setError('')
    setOriginalUrl(URL.createObjectURL(f))
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('ae-dropzone-over')
    const f = [...e.dataTransfer.files].find(f => f.type.startsWith('audio'))
    if (f) handleFile(f)
  }

  const translate = async () => {
    if (!file) { setError('Please upload an audio file first.'); return }
    setError(''); setAudioUrl(null); setLoading(true)
    setStage('Uploading audio…')

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('target_lang', targetLang)
      form.append('clone_voice', cloneVoice ? 'true' : 'false')

      setStage('SeamlessM4T translating speech… (first run downloads ~2.3 GB)')

      const res = await fetch(`${API}/api/translate`, { method: 'POST', body: form })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Translation failed')
      }
      const blob = await res.blob()
      setAudioUrl(URL.createObjectURL(blob))
      setStage('')
    } catch (e) {
      setError(e.message)
      setStage('')
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `translated_${targetLang.toLowerCase()}.wav`
    a.click()
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-label">Voice Translation</span>
        <div className="topbar-actions">
          <span className="badge badge-purple">🌐 SeamlessM4T v2 · Meta AI</span>
          <span className="badge badge-orange">🎤 OpenVoice V2 · Clone</span>
        </div>
      </div>

      {/* How it works */}
      <div className="vt-steps">
        {STEPS.map((s, i) => (
          <div className="vt-step" key={i}>
            <div className="vt-step-icon">{s.icon}</div>
            <div className="vt-step-body">
              <div className="vt-step-label">{s.label}</div>
              <div className="vt-step-desc">{s.desc}</div>
            </div>
            {i < STEPS.length - 1 && <div className="vt-step-arrow">→</div>}
          </div>
        ))}
      </div>

      <div className="tts-layout" style={{ height: 'auto', minHeight: 'calc(100vh - 200px)' }}>

        {/* ── Left panel ── */}
        <aside className="tts-panel">
          <span className="panel-title">Settings</span>

          {/* Target language */}
          <div className="form-group">
            <label className="form-label">Translate to</label>
            <div className="vt-lang-grid">
              {(languages.length ? languages : Object.keys(LANG_FLAGS)).map(lang => (
                <button
                  key={lang}
                  className={`vt-lang-btn${targetLang === lang ? ' active' : ''}`}
                  onClick={() => setTargetLang(lang)}
                >
                  <span>{LANG_FLAGS[lang] || '🌐'}</span>
                  <span>{lang}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Voice clone toggle */}
          <div className="vt-toggle-row">
            <div>
              <div className="form-label" style={{ marginBottom: 2 }}>Voice Cloning</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                Apply original speaker's tone via OpenVoice V2. Requires checkpoints.
              </div>
            </div>
            <button
              className={`vt-toggle${cloneVoice ? ' on' : ''}`}
              onClick={() => setCloneVoice(v => !v)}
              title={cloneVoice ? 'Voice cloning ON' : 'Voice cloning OFF'}
            >
              <div className="vt-toggle-thumb" />
            </button>
          </div>

          <div className="divider" />
          <span className="panel-title">Model Info</span>
          <div className="vt-info-list">
            <div className="vt-info-row"><span>Model</span><span>SeamlessM4T v2 Large</span></div>
            <div className="vt-info-row"><span>By</span><span>Meta AI</span></div>
            <div className="vt-info-row"><span>Languages</span><span>100+</span></div>
            <div className="vt-info-row"><span>Size</span><span>~2.3 GB</span></div>
            <div className="vt-info-row"><span>Task</span><span>S2ST + Voice Clone</span></div>
            <div className="vt-info-row"><span>Device</span><span>CPU / CUDA</span></div>
          </div>

          <div className="alert alert-warn" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            ⚠ First run downloads ~2.3 GB of model weights. Subsequent runs are fast.
          </div>
        </aside>

        {/* ── Right panel ── */}
        <div className="tts-main">

          {/* Upload */}
          <span className="panel-title">Source Audio</span>
          <div
            className="ae-dropzone vt-dropzone"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ae-dropzone-over') }}
            onDragLeave={e => e.currentTarget.classList.remove('ae-dropzone-over')}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            style={{ cursor: 'pointer', minHeight: 110 }}
          >
            {file ? (
              <>
                <span style={{ fontSize: 28 }}>🎵</span>
                <span className="ae-drop-text">{file.name}</span>
                <span className="ae-drop-hint">{(file.size / 1024).toFixed(1)} KB · click to change</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 32, opacity: 0.4 }}>🎙️</span>
                <span className="ae-drop-text">
                  Drag & drop or <span style={{ color: 'var(--accent)' }}>browse</span>
                </span>
                <span className="ae-drop-hint">WAV · MP3 · M4A · OGG — any spoken language</span>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="audio/*"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {/* Original playback */}
          {originalUrl && (
            <div className="vt-audio-row">
              <span className="vt-audio-label">🎙️ Original</span>
              <audio controls src={originalUrl} />
            </div>
          )}

          {error && <div className="alert alert-error">⚠ {error}</div>}

          {/* Translate button */}
          <button
            className="btn btn-primary btn-full vt-btn"
            onClick={translate}
            disabled={loading || !file}
          >
            {loading
              ? <><span className="spinner" /> {stage || 'Translating…'}</>
              : `🌐 Translate to ${targetLang}${cloneVoice ? ' + Clone Voice' : ''}`}
          </button>

          {/* Output */}
          {audioUrl && (
            <div className="vt-output">
              <div className="vt-output-header">
                <span className="vt-audio-label">
                  {LANG_FLAGS[targetLang] || '🌐'} Translated · {targetLang}
                  {cloneVoice && <span className="badge badge-purple" style={{ marginLeft: 8 }}>Voice Cloned</span>}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={download}>
                  ⬇ Download WAV
                </button>
              </div>
              <audio controls src={audioUrl} style={{ width: '100%', marginTop: 8 }} />
            </div>
          )}

          {/* Install hint */}
          <div className="vt-install-hint">
            <span className="panel-title" style={{ marginBottom: 6, display: 'block' }}>
              First time setup
            </span>
            <code>pip install transformers torchaudio sentencepiece</code>
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-faint)' }}>
              Model weights (~2.3 GB) download automatically on first translation.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
