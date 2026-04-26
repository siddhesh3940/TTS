import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { icon: '⊞',  label: 'Home',           path: '/home' },
  { icon: '🎙️', label: 'Text to Speech', path: '/text-to-speech' },
  { icon: '🎤', label: 'Voice Cloning',  path: '/voice-clone' },
  { icon: '📝', label: 'Speech to Text', path: '/speech-to-text' },
  { icon: '✂️', label: 'Audio Editor',   path: '/audio-editor' },
  { icon: '🔊', label: 'Sound Effects',  path: '#', soon: true },
  { icon: '🖼️', label: 'Image & Video',  path: '#', soon: true },
  { icon: '🔀', label: 'Flows',          path: '#', soon: true },
  { icon: '🎵', label: 'Music',          path: '#', soon: true },
]

const PINNED = [
  { icon: '🎙️', label: 'Text to Speech', path: '/text-to-speech' },
  { icon: '🎤', label: 'Voice Cloning',  path: '/voice-clone' },
  { icon: '📝', label: 'Speech to Text', path: '/speech-to-text' },
  { icon: '✂️', label: 'Audio Editor',   path: '/audio-editor' },
]

export default function Sidebar({ theme, onThemeToggle }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isLight = theme === 'light'

  const go = (path) => { if (path !== '#') navigate(path) }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎧</div>
        <span className="sidebar-brand-name">SoundStudio</span>
      </div>

      {NAV_ITEMS.map(({ icon, label, path, soon }) => (
        <button
          key={label}
          className={`sidebar-link${pathname === path ? ' active' : ''}${soon ? ' soon' : ''}`}
          onClick={() => go(path)}
          title={soon ? `${label} — coming soon` : label}
        >
          <span className="icon">{icon}</span>
          {label}
          {soon && <span className="soon-tag">Soon</span>}
        </button>
      ))}

      <div className="sidebar-spacer" />

      <div className="sidebar-section-label">Pinned</div>
      {PINNED.map(({ icon, label, path }) => (
        <button
          key={label}
          className={`sidebar-link${pathname === path ? ' active' : ''}`}
          onClick={() => go(path)}
        >
          <span className="icon">{icon}</span>
          {label}
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="divider" style={{ marginBottom: 8 }} />

        <button
          id="btn-theme-toggle"
          className="theme-toggle"
          onClick={onThemeToggle}
          aria-label="Toggle light/dark theme"
        >
          <span>{isLight ? '☀️' : '🌙'}</span>
          <span style={{ flex: 1 }}>{isLight ? 'Light' : 'Dark'} Mode</span>
          <div className={`theme-toggle-track${isLight ? ' on' : ''}`}>
            <div className="theme-toggle-thumb" />
          </div>
        </button>

        <button className="sidebar-link soon" title="Coming soon">
          <span className="icon">👨💻</span>Developers<span className="soon-tag">Soon</span>
        </button>
        <button className="sidebar-link soon" title="Coming soon">
          <span className="icon">⬆️</span>Upgrade<span className="soon-tag">Soon</span>
        </button>
      </div>
    </aside>
  )
}
