import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import TextToSpeech from './pages/TextToSpeech'
import useTheme from './hooks/useTheme'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <div className="app-shell">
      <Sidebar theme={theme} onThemeToggle={toggle} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/text-to-speech" element={<TextToSpeech />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  )
}
