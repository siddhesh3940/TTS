import React from 'react'
import { useNavigate } from 'react-router-dom'

const TOOL_CARDS = [
  { icon: '⚡', label: 'Instant speech',  bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', path: '/text-to-speech' },
  { icon: '📖', label: 'Audiobook',        bg: 'linear-gradient(135deg,#ec4899,#f97316)', path: '#' },
  { icon: '🎬', label: 'Image & Video',    bg: 'linear-gradient(135deg,#10b981,#06b6d4)', path: '#' },
  { icon: '🤖', label: 'AI Agents',        bg: 'linear-gradient(135deg,#a855f7,#6366f1)', path: '#' },
  { icon: '🎵', label: 'Music',            bg: 'linear-gradient(135deg,#f59e0b,#f97316)', path: '#' },
  { icon: '🌐', label: 'Dubbed video',     bg: 'linear-gradient(135deg,#14b8a6,#0ea5e9)', path: '#' },
]

const LIBRARY_ITEMS = [
  { initials: 'M', color: '#7c3aed', name: 'Mahesh — Banarasi Recovery Agent',  desc: 'Mahesh delivers a warm, relatable, and problem-solving tone…' },
  { initials: 'M', color: '#2563eb', name: 'Manav — Charming, Husky and Warm',  desc: 'Manav — Charming, Husky Indian Male Voice — A rich, husky voice…' },
  { initials: 'S', color: '#db2777', name: 'Saavi — Soft, Tender and Relatable', desc: 'Saavi — Innocent Social Media Voice, Expressive & Relatable…' },
  { initials: 'B', color: '#d97706', name: 'Bunty — Punchy, Crisp and Reel King', desc: 'Bunty — Real Perfect Voice · A vibrant AI voice crafted…' },
  { initials: 'P', color: '#059669', name: 'Priyanka',                           desc: 'Warm but bright Indian female storyteller voice…' },
]

const VOICE_CLONE_CARDS = [
  { icon: '✨', bg: '#7c3aed', label: 'Voice Design',      subtitle: 'Design an entirely new voice from a text prompt' },
  { icon: '🎤', bg: '#0ea5e9', label: 'Clone your Voice',  subtitle: 'Create a realistic digital clone of your voice' },
  { icon: '📚', bg: '#10b981', label: 'Voice Collections', subtitle: 'Curated AI voices for every use case' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()

  const go = (path) => { if (path !== '#') navigate(path) }

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <span className="topbar-label">My Workspace</span>
        <div className="topbar-actions">
          <button className="topbar-pill">✨ New · Introducing Music Marketplace</button>
        </div>
      </div>

      {/* Greeting */}
      <h1 className="greeting-title">{getGreeting()}, Sid</h1>

      {/* Tool Cards */}
      <p className="section-heading">Workspace tools</p>
      <div className="cards-grid">
        {TOOL_CARDS.map(({ icon, label, bg, path }) => (
          <div className="tool-card" key={label} onClick={() => go(path)}>
            <div className="tool-card-icon" style={{ background: bg }}>
              {icon}
            </div>
            <span className="tool-card-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Two column split */}
      <div className="home-split">
        {/* Latest from the library */}
        <div>
          <p className="section-heading">Latest from the library</p>
          <div className="library-list">
            {LIBRARY_ITEMS.map(({ initials, color, name, desc }) => (
              <div className="library-item" key={name}>
                <div className="library-avatar" style={{ background: color + '33', color }}>
                  {initials}
                </div>
                <div className="library-meta">
                  <div className="library-name">{name}</div>
                  <div className="library-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <br />
          <button className="btn btn-secondary btn-sm" onClick={() => go('/text-to-speech')}>
            Explore Library
          </button>
        </div>

        {/* Create or clone a voice */}
        <div>
          <p className="section-heading">Create or clone a voice</p>
          <div className="clone-grid">
            {VOICE_CLONE_CARDS.map(({ icon, bg, label, subtitle }) => (
              <div className="clone-item" key={label} onClick={() => go('/text-to-speech')}>
                <div className="clone-icon" style={{ background: bg + '33', color: bg }}>
                  {icon}
                </div>
                <div className="clone-meta">
                  <div className="clone-title">{label}</div>
                  <div className="clone-subtitle">{subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
