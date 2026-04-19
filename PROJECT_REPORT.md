# Project Report

## SoundStudio — Multilingual Text-to-Speech, Voice Cloning & AI Assistant Platform

---

**Project Name:** SoundStudio
**Repository:** https://github.com/siddhesh3940/TTS
**Technology Stack:** FastAPI · React 18 · Vite · OpenVoice V2 · MeloTTS · edge-tts · Groq AI
**Report Date:** April 2026

---

## 1. Executive Summary

SoundStudio is a full-stack web application that combines three AI-powered capabilities into a single unified platform: multilingual neural text-to-speech synthesis, zero-shot voice cloning, and a conversational AI assistant. The application is built on a FastAPI Python backend and a React + Vite frontend, offering a modern, responsive interface with dark and light mode support.

The platform enables users to convert text into natural-sounding speech across 20+ languages using Microsoft Azure Neural Voices, clone any voice from a short audio sample using OpenVoice V2, and interact with a floating AI chatbot powered by Groq's inference API running state-of-the-art large language models.

---

## 2. Objectives

- Build a production-ready multilingual TTS system with fine-grained audio controls
- Implement zero-shot voice cloning from a reference audio sample
- Integrate an AI chatbot accessible from every page of the application
- Provide subtitle generation (VTT and SRT) with word-level timestamps
- Deliver a polished, dark/light mode UI consistent with modern design standards
- Expose a clean REST API for all features

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                    │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │   TTS    │  │Voice Cloning│  │  Chat Widget   │  │
│  │  Page    │  │    Page     │  │  (all pages)   │  │
│  └────┬─────┘  └──────┬──────┘  └───────┬────────┘  │
└───────┼───────────────┼─────────────────┼───────────┘
        │               │                 │
        ▼               ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (main.py)               │
│  /api/generate  /api/clone  /api/chat  /api/voices  │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
     ┌─────▼─────┐  ┌─────▼──────┐  ┌───▼────────┐
     │ edge-tts  │  │OpenVoice V2│  │  Groq API  │
     │(MS Azure) │  │ + MeloTTS  │  │(Llama/Mix) │
     └───────────┘  └────────────┘  └────────────┘
```

### 3.2 Backend (FastAPI)

The backend is a single `main.py` FastAPI application exposing five REST endpoints. It handles:

- Async TTS generation via `edge-tts` streaming
- Voice cloning pipeline (MeloTTS base generation → tone color extraction → conversion)
- AI chat completions via Groq SDK
- Static file serving for generated audio outputs
- CORS middleware for frontend communication

### 3.3 Frontend (React + Vite)

The frontend is a single-page application with React Router DOM handling client-side navigation. It consists of:

- A persistent sidebar with navigation and theme toggle
- Three main pages: Home, Text to Speech, Voice Cloning
- A floating ChatWidget component rendered globally across all pages
- CSS custom properties for full dark/light mode theming

---

## 4. Features

### 4.1 Text to Speech

- **20+ Languages:** English (US, UK, AU, IN), Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Urdu, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Korean, Arabic, Russian
- **60+ Neural Voices:** Multiple accents, genders, and voice personalities per language, powered by Microsoft Azure Neural Voices via `edge-tts`
- **Audio Controls:**
  - Speed: -50% to +100% (step 5)
  - Pitch: -50Hz to +50Hz (step 5)
  - Volume: -50% to +50% (step 5)
- **Subtitle Generation:** Automatic VTT and SRT caption files with word-level timestamps derived from edge-tts WordBoundary events, grouped into 5-word caption blocks
- **Output Formats:** MP3 audio, VTT subtitles, SRT subtitles
- **Instant Playback:** Audio player embedded in the browser

### 4.2 Voice Cloning

- **Engine:** OpenVoice V2 by MyShell AI
- **Pipeline:**
  1. Generate base speech from input text using MeloTTS (EN-Default speaker)
  2. Extract tone color embedding from the reference audio using OpenVoice's speaker encoder
  3. Convert the base speech tone to match the reference voice
- **Reference Audio:** Accepts WAV or MP3, drag-and-drop or file browser upload
- **Output:** WAV file downloadable directly from the browser
- **Recommended Input:** 6–30 seconds of clean, single-speaker audio

### 4.3 AI Chatbot (Floating Widget)

- **Placement:** Fixed bottom-right circular button (🤖) visible on all pages
- **Models Available:**
  - Llama 3.3 70B Versatile (default)
  - Mixtral 8x7B 32K
  - Gemma 2 9B
- **Features:**
  - In-panel model switcher
  - Animated typing indicator (three-dot bounce)
  - Full conversation history maintained per session
  - Enter to send, Shift+Enter for new line
  - System prompt contextualises the assistant as a SoundStudio helper
- **Backend:** Groq inference API via the official `groq` Python SDK

### 4.4 UI / UX

- Dark and light mode with persistent toggle (localStorage via custom `useTheme` hook)
- Responsive two-column layout for TTS and Voice Cloning pages
- Home dashboard with workspace tool cards, voice library preview, and voice creation shortcuts
- Sidebar with pinned shortcuts and navigation

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend framework | FastAPI + Uvicorn | REST API, async request handling |
| TTS engine | edge-tts | Microsoft Azure Neural Voice synthesis |
| Voice cloning | OpenVoice V2 | Tone color conversion |
| Base TTS for cloning | MeloTTS | EN-Default base speech generation |
| Audio processing | pydub + ffmpeg | Audio file reading and format conversion |
| AI chatbot | Groq SDK | LLM inference (Llama 3.3, Mixtral, Gemma) |
| NLP (MeloTTS dep.) | NLTK | POS tagging for text processing |
| Deep learning | PyTorch | Model inference for OpenVoice |
| Environment config | python-dotenv | Secure API key management via .env |
| Frontend framework | React 18 + Vite | SPA with fast HMR development |
| Routing | React Router DOM | Client-side page navigation |
| Styling | CSS custom properties | Dark/light theming |

---

## 6. API Reference

### GET `/api/voices`
Returns the full voice database as a nested JSON object organised by Language → Region → Gender → Voice Name → Voice Code.

### POST `/api/generate`
Generates speech audio and subtitles from text.

**Request body:**
```json
{
  "text": "Hello world",
  "voice_code": "en-US-AriaNeural",
  "rate": 0,
  "pitch": 0,
  "volume": 0
}
```

**Response:**
```json
{
  "audio_url": "/api/audio",
  "vtt": "WEBVTT\n\n00:00:00.000 --> ...",
  "srt": "1\n00:00:00,000 --> ..."
}
```

### GET `/api/audio`
Downloads the most recently generated MP3 file.

### GET `/api/srt`
Downloads the most recently generated SRT subtitle file.

### POST `/api/clone`
Clones a voice and generates speech. Accepts multipart form data.

**Form fields:**
- `text` — text to synthesise
- `file` — reference audio file (WAV or MP3)

**Response:** WAV audio file (binary stream)

### POST `/api/chat`
Sends a message to the AI chatbot.

**Request body:**
```json
{
  "messages": [
    {"role": "user", "content": "What voices are available?"}
  ],
  "model": "llama-3.3-70b-versatile"
}
```

**Response:**
```json
{
  "reply": "SoundStudio supports 60+ neural voices across 20+ languages..."
}
```

---

## 7. Project Structure

```
TTS/
├── main.py                        # FastAPI backend — all endpoints
├── requirements.txt               # Python dependencies
├── setup_openvoice.py             # One-time OpenVoice checkpoint downloader
├── .env                           # API keys (gitignored)
├── .gitignore
├── README.md
├── outputs/                       # Generated files (gitignored)
│   ├── output.mp3
│   ├── output.srt
│   └── clone/
│       ├── base_output.wav
│       └── cloned_output.wav
├── openvoice_checkpoints/         # Model weights (gitignored)
│   └── checkpoints_v2/
│       ├── converter/
│       │   ├── config.json
│       │   └── checkpoint.pth
│       └── base_speakers/ses/
│           └── en-default.pth
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                # Root component, routes, ChatWidget mount
        ├── App.css
        ├── index.css              # Global styles + chat widget CSS
        ├── components/
        │   ├── Sidebar.jsx        # Navigation sidebar
        │   └── ChatWidget.jsx     # Floating AI chatbot widget
        ├── hooks/
        │   └── useTheme.js        # Dark/light mode persistence
        └── pages/
            ├── Home.jsx           # Dashboard
            ├── TextToSpeech.jsx   # TTS page
            └── VoiceClone.jsx     # Voice cloning page
```

---

## 8. Setup & Installation

### Prerequisites
- Python 3.11
- Node.js 16+
- ffmpeg (installed via `winget install --id Gyan.FFmpeg -e` on Windows)
- Internet connection

### Backend Setup
```bash
git clone https://github.com/siddhesh3940/TTS.git
cd TTS
python -m venv .venv311
.venv311\Scripts\activate
pip install -r requirements.txt
python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng'); nltk.download('cmudict')"
python setup_openvoice.py
```

### Environment Configuration
Create a `.env` file in the project root:
```
GROQ_API_KEY=<your_groq_api_key>
```

### Start Backend
```bash
.venv311\Scripts\uvicorn.exe main:app --reload
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

---

## 9. Known Limitations

| Limitation | Detail |
|-----------|--------|
| Internet required | edge-tts calls Microsoft's live API; no offline TTS |
| No generation history | Each TTS run overwrites `outputs/output.mp3` |
| Single input only | No batch text processing |
| Voice cloning English only | OpenVoice V2 uses EN-Default MeloTTS base; other languages not supported |
| First clone is slow | BERT weights (~400MB) download on first use |
| ffmpeg path hardcoded | pydub is patched to use the winget ffmpeg install path on this machine |
| No user authentication | Single-user local deployment only |
| Chat history not persisted | Conversation resets on page refresh |

---

## 10. Future Enhancements

- **Batch TTS processing** — accept multiple lines or a document and generate audio per paragraph
- **Voice history** — store and replay previously generated audio files
- **Multilingual voice cloning** — extend OpenVoice cloning to non-English languages
- **TTS + Chat integration** — speak chatbot responses using edge-tts directly in the widget
- **User accounts** — save voice preferences, generation history, and chat sessions
- **Cloud deployment** — containerise with Docker and deploy to AWS/GCP
- **Real-time streaming TTS** — stream audio chunks to the browser as they are generated
- **Custom voice fine-tuning** — allow users to fine-tune a voice model on longer recordings

---

## 11. Acknowledgements

- **edge-tts** — Free Python library for Microsoft Edge TTS by rany2
- **OpenVoice V2** — Zero-shot voice cloning by MyShell AI
- **MeloTTS** — High-quality multilingual TTS by MyShell AI
- **Groq** — Ultra-fast LLM inference API
- **FastAPI** — Modern async Python web framework by Sebastián Ramírez
- **React + Vite** — Fast frontend tooling by Meta and Evan You

---

*Report generated for SoundStudio project — April 2026*
