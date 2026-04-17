import { useState, useEffect } from 'react'

export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ss-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ss-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
