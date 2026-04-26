import React, { useState, useRef, useEffect, useCallback } from 'react'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00.000'
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(3).padStart(6, '0')
  return `${m}:${sec}`
}

// Draw full waveform + dimmed regions outside selection + handle lines + playhead
function renderCanvas(canvas, audioBuffer, region, playFraction) {
  if (!canvas || !audioBuffer) return
  const ctx   = canvas.getContext('2d')
  const W     = canvas.width
  const H     = canvas.height
  const dur   = audioBuffer.duration
  const data  = audioBuffer.getChannelData(0)
  const total = data.length
  const step  = Math.ceil(total / W)
  const mid   = H / 2

  // background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // centre line
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()

  // convert region times → pixel positions
  const sx = Math.round((region.start / dur) * W)
  const ex = Math.round((region.end   / dur) * W)

  // draw waveform — dimmed outside selection, bright inside
  for (let i = 0; i < W; i++) {
    let mn = 1, mx = -1
    for (let j = 0; j < step; j++) {
      const v = data[i * step + j] || 0
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    const yH = (1 - mx) / 2 * H
    const yL = (1 - mn) / 2 * H
    const inRegion = i >= sx && i <= ex
    ctx.fillStyle = inRegion ? '#f97316' : '#3a2010'
    ctx.fillRect(i, yH, 1, Math.max(1, yL - yH))
  }

  // dim overlay outside selection
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0,  0, sx, H)
  ctx.fillRect(ex, 0, W - ex, H)

  // selected region border top/bottom highlight
  ctx.strokeStyle = 'rgba(249,115,22,0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(sx, 0, ex - sx, H)

  // ── start handle (orange) ──
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
  // handle grip triangle top
  ctx.fillStyle = '#f97316'
  ctx.beginPath(); ctx.moveTo(sx - 6, 0); ctx.lineTo(sx + 6, 0); ctx.lineTo(sx, 10); ctx.closePath(); ctx.fill()
  // handle grip triangle bottom
  ctx.beginPath(); ctx.moveTo(sx - 6, H); ctx.lineTo(sx + 6, H); ctx.lineTo(sx, H - 10); ctx.closePath(); ctx.fill()

  // ── end handle (red) ──
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex, H); ctx.stroke()
  ctx.fillStyle = '#ef4444'
  ctx.beginPath(); ctx.moveTo(ex - 6, 0); ctx.lineTo(ex + 6, 0); ctx.lineTo(ex, 10); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(ex - 6, H); ctx.lineTo(ex + 6, H); ctx.lineTo(ex, H - 10); ctx.closePath(); ctx.fill()

  // ── time labels on handles ──
  ctx.font = '10px monospace'
  ctx.fillStyle = '#f97316'
  ctx.fillText(fmtTime(region.start), Math.min(sx + 4, W - 60), 14)
  ctx.fillStyle = '#ef4444'
  const endLabel = fmtTime(region.end)
  ctx.fillText(endLabel, Math.max(ex - 60, 0), H - 4)

  // ── playhead ──
  if (playFraction >= 0) {
    const px = Math.round(sx + playFraction * (ex - sx))
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke()
  }
}

// ── AudioTrack ────────────────────────────────────────────────────────────────

const HANDLE_HIT = 10 // px grab radius

function AudioTrack({ track, onRemove, onUpdate }) {
  const wrapRef      = useRef(null)
  const canvasRef    = useRef(null)
  const rafRef       = useRef(null)
  const srcRef       = useRef(null)
  const acRef        = useRef(null)
  const startedAtRef = useRef(0)
  const pausedAtRef  = useRef(0)
  const dragRef      = useRef(null)   // { handle: 'start'|'end' }
  const regionRef    = useRef(track.region)

  const [playing, setPlaying]   = useState(false)
  const [currentTime, setCT]    = useState(track.region.start)
  const [tooltip, setTooltip]   = useState(null) // { x, label }

  // keep regionRef in sync
  useEffect(() => { regionRef.current = track.region }, [track.region])

  // ── canvas sizing + draw ──────────────────────────────────────────────────
  const draw = useCallback((playFrac = -1) => {
    const canvas = canvasRef.current
    if (!canvas || !track.buffer) return
    const wrap = wrapRef.current
    if (wrap) {
      canvas.width  = wrap.clientWidth  || 800
      canvas.height = wrap.clientHeight || 100
    }
    renderCanvas(canvas, track.buffer, regionRef.current, playFrac)
  }, [track.buffer])

  useEffect(() => { draw() }, [draw, track.region])

  // resize observer
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [draw])

  // ── drag handle logic ─────────────────────────────────────────────────────
  const xToTime = (clientX) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return frac * track.buffer.duration
  }

  const hitHandle = (clientX) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const W    = rect.width
    const dur  = track.buffer.duration
    const sx   = (regionRef.current.start / dur) * W + rect.left
    const ex   = (regionRef.current.end   / dur) * W + rect.left
    if (Math.abs(clientX - sx) <= HANDLE_HIT) return 'start'
    if (Math.abs(clientX - ex) <= HANDLE_HIT) return 'end'
    return null
  }

  const onMouseMove = useCallback((e) => {
    if (!track.buffer) return
    const handle = hitHandle(e.clientX)

    if (dragRef.current) {
      // dragging
      const t   = xToTime(e.clientX)
      const dur = track.buffer.duration
      let next  = { ...regionRef.current }
      if (dragRef.current.handle === 'start') {
        next.start = Math.max(0, Math.min(t, next.end - 0.05))
      } else {
        next.end = Math.min(dur, Math.max(t, next.start + 0.05))
      }
      regionRef.current = next
      draw()
      setTooltip({
        x: e.clientX - canvasRef.current.getBoundingClientRect().left,
        label: dragRef.current.handle === 'start'
          ? `Start: ${fmtTime(next.start)}`
          : `End: ${fmtTime(next.end)}`
      })
    } else {
      // hover cursor
      if (canvasRef.current)
        canvasRef.current.style.cursor = handle ? 'ew-resize' : 'default'
    }
  }, [track.buffer, draw])

  const onMouseDown = useCallback((e) => {
    const handle = hitHandle(e.clientX)
    if (!handle) return
    e.preventDefault()
    dragRef.current = { handle }
    stopPlayback()
    pausedAtRef.current = 0
  }, [])

  const onMouseUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setTooltip(null)
    onUpdate({ ...track, region: { ...regionRef.current } })
  }, [track, onUpdate])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',  onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',  onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  // ── playback ──────────────────────────────────────────────────────────────
  const getAC = () => {
    if (!acRef.current || acRef.current.state === 'closed')
      acRef.current = new AudioContext()
    return acRef.current
  }

  const animate = useCallback(() => {
    const ac = acRef.current
    if (!ac) return
    const elapsed   = ac.currentTime - startedAtRef.current + pausedAtRef.current
    const regionLen = regionRef.current.end - regionRef.current.start
    const t         = Math.min(elapsed, regionLen)
    setCT(regionRef.current.start + t)
    draw(t / regionLen)
    if (t < regionLen) rafRef.current = requestAnimationFrame(animate)
    else stopPlayback()
  }, [draw])

  const stopPlayback = () => {
    srcRef.current?.stop()
    srcRef.current = null
    cancelAnimationFrame(rafRef.current)
    setPlaying(false)
  }

  const togglePlay = () => {
    if (playing) {
      pausedAtRef.current += acRef.current.currentTime - startedAtRef.current
      stopPlayback(); return
    }
    const ac  = getAC()
    const sr  = track.buffer.sampleRate
    const s0  = Math.floor(regionRef.current.start * sr)
    const s1  = Math.floor(regionRef.current.end   * sr)
    const len = s1 - s0
    const buf = ac.createBuffer(track.buffer.numberOfChannels, len, sr)
    for (let c = 0; c < track.buffer.numberOfChannels; c++)
      buf.copyToChannel(track.buffer.getChannelData(c).slice(s0, s1), c)
    const src = ac.createBufferSource()
    src.buffer = buf
    src.connect(ac.destination)
    src.start(0, pausedAtRef.current)
    srcRef.current      = src
    startedAtRef.current = ac.currentTime
    setPlaying(true)
    rafRef.current = requestAnimationFrame(animate)
  }

  const resetPlayhead = () => {
    stopPlayback()
    pausedAtRef.current = 0
    setCT(regionRef.current.start)
    draw()
  }

  const dur = track.buffer?.duration || 0
  const selLen = track.region.end - track.region.start

  return (
    <div className="ae-track">
      <div className="ae-track-header">
        <span className="ae-track-name" title={track.name}>{track.name}</span>
        <span className="ae-track-dur">{fmtTime(dur)}</span>
        <button className="ae-icon-btn" onClick={onRemove} title="Remove track">✕</button>
      </div>

      {/* Waveform + draggable handles */}
      <div ref={wrapRef} className="ae-canvas-wrap" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className="ae-canvas"
          onMouseDown={onMouseDown}
        />
        {/* Tooltip while dragging */}
        {tooltip && (
          <div
            className="ae-handle-tooltip"
            style={{ left: Math.min(tooltip.x + 8, (wrapRef.current?.clientWidth || 300) - 100) }}
          >
            {tooltip.label}
          </div>
        )}
        {/* Legend */}
        <div className="ae-handle-legend">
          <span className="ae-legend-start">▐ Start</span>
          <span className="ae-legend-end">End ▌</span>
        </div>
      </div>

      {/* Transport bar */}
      <div className="ae-transport">
        <button className="ae-icon-btn" onClick={resetPlayhead} title="Reset to start">⏮</button>
        <button className="ae-play-btn" onClick={togglePlay} disabled={!track.buffer}>
          {playing ? '⏸' : '▶'}
        </button>
        <span className="ae-time">{fmtTime(currentTime)}</span>

        <div className="ae-region-info">
          <span className="ae-region-chip ae-region-chip-start">
            ▐ {fmtTime(track.region.start)}
          </span>
          <span className="ae-region-chip ae-region-chip-end">
            {fmtTime(track.region.end)} ▌
          </span>
          <span className="ae-region-chip ae-region-chip-len">
            ⏱ {fmtTime(selLen)}
          </span>
          <button
            className="ae-icon-btn"
            title="Reset selection to full track"
            onClick={() => {
              regionRef.current = { start: 0, end: dur }
              onUpdate({ ...track, region: { start: 0, end: dur } })
              resetPlayhead()
            }}
          >↺</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AudioEditor() {
  const [tracks, setTracks]       = useState([])
  const [merging, setMerging]     = useState(false)
  const [outputUrl, setOutputUrl] = useState(null)
  const [outputName, setOutputName] = useState('')
  const [error, setError]         = useState('')
  const fileRef = useRef()

  const loadFiles = async (files) => {
    setError('')
    const ac = new AudioContext()
    for (const file of files) {
      try {
        const ab     = await file.arrayBuffer()
        const buffer = await ac.decodeAudioData(ab)
        setTracks(prev => [...prev, {
          id:     Date.now() + Math.random(),
          name:   file.name,
          buffer,
          region: { start: 0, end: buffer.duration },
        }])
      } catch {
        setError(`Could not decode "${file.name}". Use MP3, WAV, OGG, or FLAC.`)
      }
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    loadFiles([...e.dataTransfer.files].filter(f => f.type.startsWith('audio')))
  }

  const onFileInput  = (e) => loadFiles([...e.target.files])
  const removeTrack  = (id) => setTracks(prev => prev.filter(t => t.id !== id))
  const updateTrack  = (updated) => setTracks(prev => prev.map(t => t.id === updated.id ? updated : t))

  // ── Export ────────────────────────────────────────────────────────────────
  const exportAudio = async () => {
    if (!tracks.length) return
    setMerging(true); setOutputUrl(null); setError('')
    try {
      const SR = 44100
      const channels = 2
      const totalSamples = tracks.reduce((sum, t) =>
        sum + Math.floor((t.region.end - t.region.start) * SR), 0)

      const offline = new OfflineAudioContext(channels, totalSamples, SR)
      let offset = 0

      for (const track of tracks) {
        const sr  = track.buffer.sampleRate
        const s0  = Math.floor(track.region.start * sr)
        const s1  = Math.floor(track.region.end   * sr)
        const len = s1 - s0
        const mono = track.buffer.numberOfChannels === 1

        const tmpAC  = new OfflineAudioContext(channels, Math.ceil(len * SR / sr), SR)
        const tmpBuf = tmpAC.createBuffer(channels, len, sr)
        for (let c = 0; c < channels; c++) {
          const srcCh = mono ? 0 : Math.min(c, track.buffer.numberOfChannels - 1)
          tmpBuf.copyToChannel(track.buffer.getChannelData(srcCh).slice(s0, s1), c)
        }
        const tmpSrc = tmpAC.createBufferSource()
        tmpSrc.buffer = tmpBuf
        tmpSrc.connect(tmpAC.destination)
        tmpSrc.start()
        const resampled = await tmpAC.startRendering()

        const mainSrc = offline.createBufferSource()
        mainSrc.buffer = resampled
        mainSrc.connect(offline.destination)
        mainSrc.start(offset / SR)
        offset += resampled.length
      }

      const rendered = await offline.startRendering()
      const blob = encodeWAV(rendered)
      const name = `edited_${Date.now()}.wav`
      setOutputUrl(URL.createObjectURL(blob))
      setOutputName(name)
    } catch (e) {
      setError(`Export failed: ${e.message}`)
    } finally {
      setMerging(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-label">Audio Editor</span>
        <div className="topbar-actions">
          <span className="badge badge-orange">✂️ Cut · Merge · Export · 100% Local</span>
        </div>
      </div>

      <div className="ae-page">

        {/* ── Upload section ── */}
        <div className="ae-upload-section">
          <div className="ae-upload-card">
            <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
            <div className="ae-upload-card-title">Browse Files</div>
            <div className="ae-upload-card-hint">MP3 · WAV · OGG · FLAC · M4A</div>
            <button className="btn btn-primary" style={{ marginTop: 14 }}
              onClick={() => fileRef.current.click()}>
              Open File Explorer
            </button>
          </div>
          <div className="ae-upload-or">
            <div className="ae-upload-or-line" />
            <span>or</span>
            <div className="ae-upload-or-line" />
          </div>
          <div
            className="ae-dropzone"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ae-dropzone-over') }}
            onDragLeave={e => e.currentTarget.classList.remove('ae-dropzone-over')}
            onDrop={e => { e.currentTarget.classList.remove('ae-dropzone-over'); onDrop(e) }}
          >
            <span style={{ fontSize: 36, opacity: 0.5 }}>🎵</span>
            <span className="ae-drop-text">Drag & drop audio files here</span>
            <span className="ae-drop-hint">Multiple files · added as separate tracks</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="audio/*" multiple
          style={{ display: 'none' }} onChange={onFileInput} />

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Tracks ── */}
        {tracks.length > 0 && (
          <div className="ae-tracks">
            <div className="ae-tracks-header">
              <div>
                <span className="panel-title">Tracks ({tracks.length})</span>
                <span className="ae-drag-hint">
                  Drag the <span style={{ color: '#f97316' }}>orange</span> and{' '}
                  <span style={{ color: '#ef4444' }}>red</span> handles on the waveform to trim
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setTracks([])}>
                🗑 Clear all
              </button>
            </div>
            {tracks.map(track => (
              <AudioTrack key={track.id} track={track}
                onRemove={() => removeTrack(track.id)}
                onUpdate={updateTrack} />
            ))}
          </div>
        )}

        {/* ── Export ── */}
        {tracks.length > 0 && (
          <div className="ae-export">
            <span className="panel-title">Export</span>
            <div className="ae-export-row">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {tracks.length === 1
                  ? `Trim "${tracks[0].name}" to selected region`
                  : `Merge ${tracks.length} tracks in sequence · 44.1 kHz · Stereo · 16-bit WAV`}
              </span>
              <button className="btn btn-primary" onClick={exportAudio} disabled={merging}>
                {merging ? <><span className="spinner" /> Processing…</> : '⬇ Export WAV'}
              </button>
            </div>
            {outputUrl && (
              <div className="ae-output">
                <span className="panel-title">Output</span>
                <audio controls src={outputUrl} style={{ width: '100%', marginTop: 8 }} />
                <div style={{ marginTop: 10 }}>
                  <a className="btn btn-secondary btn-sm" href={outputUrl} download={outputName}>
                    ⬇ Download WAV
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {tracks.length === 0 && (
          <div className="ae-empty">
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>✂️</div>
            <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
              Upload audio files above to start editing
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── WAV encoder ───────────────────────────────────────────────────────────────

function encodeWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate  = audioBuffer.sampleRate
  const numSamples  = audioBuffer.length
  const blockAlign  = numChannels * 2
  const dataSize    = numSamples * blockAlign
  const buf         = new ArrayBuffer(44 + dataSize)
  const view        = new DataView(buf)
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE')
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataSize, true)
  let off = 44
  for (let i = 0; i < numSamples; i++)
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(c)[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
    }
  return new Blob([buf], { type: 'audio/wav' })
}
