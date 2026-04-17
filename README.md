# 🎙️ Text to Speech with Subtitle Generation

A multilingual text-to-speech web application built with **FastAPI** (backend) and **React + Vite** (frontend). Convert text to natural-sounding speech in 20+ languages and automatically generate synchronized subtitles (VTT/SRT) for video editing.

---

## ✨ Features

- **20+ Languages** — English, Hindi, Tamil, Telugu, Bengali, Spanish, French, German, Japanese, Chinese, Korean, Arabic, and more
- **60+ Neural Voices** — Multiple accents, genders, and voice personalities per language
- **Audio Controls** — Adjust speed (-50% to +100%), pitch (-50Hz to +50Hz), and volume (-50% to +50%)
- **Subtitle Generation** — Automatic VTT and SRT caption files with word-level timestamps
- **Instant Playback** — Listen to generated audio directly in the browser
- **One-Click Download** — Export MP3, VTT, and SRT files

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI + Python |
| Frontend | React 18 + Vite |
| TTS Engine | edge-tts (Microsoft Azure Neural Voices) |
| Routing | React Router DOM |
| Audio Format | MP3 |
| Subtitle Formats | VTT, SRT |
| Async Runtime | asyncio |

---

## 🗂️ Project Structure

```
TTS/
├── main.py                  # FastAPI backend
├── requirements.txt         # Python dependencies
├── voices.txt               # Full list of available voices (400+)
├── .gitignore
├── README.md
├── outputs/                 # Generated audio files (auto-created, not tracked)
│   └── output.mp3
└── frontend/                # React Vite frontend
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   ├── hooks/
    │   │   └── useTheme.js
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   └── TextToSpeech.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- Internet connection (for edge-tts API)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/siddhesh3940/TTS.git
cd TTS
```

---

### Step 2 — Backend Setup (FastAPI)

**Create and activate a virtual environment**

Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

macOS/Linux:
```bash
python -m venv venv
source venv/bin/activate
```

**Install Python dependencies**

```bash
pip install fastapi uvicorn edge-tts
```

**Start the backend server**

```bash
uvicorn main:app --reload
```

Backend runs at → `http://localhost:8000`

---

### Step 3 — Frontend Setup (React + Vite)

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

### Step 4 — Open the app

Go to `http://localhost:5173` in your browser.

---

## 📖 How to Use

1. **Select Voice Settings**
   - Choose Language (e.g., English, Hindi, Spanish)
   - Select Region (e.g., United States, India, Spain)
   - Pick Gender (Male/Female)
   - Choose Voice personality

2. **Adjust Audio Controls** (optional)
   - Speed: -50% (slower) to +100% (faster)
   - Pitch: -50Hz (lower) to +50Hz (higher)
   - Volume: -50% (quieter) to +50% (louder)

3. **Enter Your Text**
   - Type or paste text in the script area

4. **Generate Speech**
   - Click "Generate Speech"
   - Wait for processing (usually 2-5 seconds)

5. **Download Outputs**
   - **⬇ MP3** — Audio file
   - **⬇ VTT** — WebVTT subtitle file (for HTML5 video)
   - **⬇ SRT** — SubRip subtitle file (for video editors)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voices` | Returns full voice database |
| POST | `/api/generate` | Generates speech + subtitles |
| GET | `/api/audio` | Downloads the generated MP3 |

### POST `/api/generate` — Request Body

```json
{
  "text": "Hello world",
  "voice_code": "en-US-AriaNeural",
  "rate": 0,
  "pitch": 0,
  "volume": 0
}
```

### Response

```json
{
  "audio_url": "/api/audio",
  "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:01.200\nHello world",
  "srt": "1\n00:00:00,000 --> 00:00:01,200\nHello world"
}
```

---

## 📋 Supported Languages

- **English** — US, UK, Australia, India
- **Indian Languages** — Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Urdu
- **European** — Spanish, French, German, Italian, Portuguese, Russian
- **Asian** — Japanese, Chinese (Mandarin, Taiwan), Korean
- **Middle Eastern** — Arabic (Saudi, Egypt)

---

## ⚠️ Limitations

- **Internet Required** — edge-tts calls Microsoft's live API
- **No History** — Each generation overwrites `outputs/output.mp3`
- **Single Input** — One text at a time (no batch processing yet)

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **edge-tts** — Free Python library for Microsoft Edge TTS
- **FastAPI** — Modern Python web framework
- **React + Vite** — Fast frontend tooling
- **Microsoft Azure** — Neural voice models

---

**Made with ❤️ using FastAPI and React**
