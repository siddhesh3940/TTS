import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import TextToSpeech from './pages/TextToSpeech'
import VoiceClone from './pages/VoiceClone'
import SpeechToText from './pages/SpeechToText'
import AudioEditor from './pages/AudioEditor'
import ChatWidget from './components/ChatWidget'
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
          <Route path="/voice-clone" element={<VoiceClone />} />
          <Route path="/speech-to-text" element={<SpeechToText />} />
          <Route path="/audio-editor" element={<AudioEditor />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  )
}
