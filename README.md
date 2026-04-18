# 🎧 SoundStudio

A multilingual text-to-speech and voice cloning web application built with **FastAPI** (backend) and **React + Vite** (frontend).

---

## ✨ Features

- **20+ Languages** — English, Hindi, Tamil, Telugu, Bengali, Spanish, French, German, Japanese, Chinese, Korean, Arabic, and more
- **60+ Neural Voices** — Multiple accents, genders, and voice personalities per language
- **Audio Controls** — Adjust speed (-50% to +100%), pitch (-50Hz to +50Hz), and volume (-50% to +50%)
- **Subtitle Generation** — Automatic VTT and SRT caption files with word-level timestamps
- **Voice Cloning** — Clone any voice from a reference audio sample using OpenVoice V2
- **Instant Playback** — Listen to generated audio directly in the browser
- **One-Click Download** — Export MP3, WAV, VTT, and SRT files
- **Dark / Light Mode** — Persistent theme toggle

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI + Python |
| Frontend | React 18 + Vite |
| TTS Engine | edge-tts (Microsoft Azure Neural Voices) |
| Voice Cloning | OpenVoice V2 + MeloTTS |
| Audio Processing | pydub + ffmpeg |
| Routing | React Router DOM |
| Audio Format | MP3 (TTS), WAV (Voice Clone) |
| Subtitle Formats | VTT, SRT |

---

## 🗂️ Project Structure

```
TTS/
├── main.py                  # FastAPI backend
├── requirements.txt         # Python dependencies
├── setup_openvoice.py       # One-time OpenVoice checkpoint downloader
├── voices.txt               # Full list of available voices (400+)
├── .gitignore
├── README.md
├── outputs/                 # Generated audio files (auto-created, not tracked)
│   ├── output.mp3
│   ├── output.srt
│   └── clone/               # Voice cloning outputs
├── openvoice_checkpoints/   # OpenVoice V2 model weights (auto-created)
│   └── checkpoints_v2/
│       ├── converter/
│       └── base_speakers/ses/
└── frontend/                # React Vite frontend
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   ├── hooks/
    │   │   └── useTheme.js
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── TextToSpeech.jsx
    │   │   └── VoiceClone.jsx
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

- Python 3.11
- Node.js 16 or higher
- Internet connection (for edge-tts API and model downloads)
- ffmpeg (see Step 3)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/siddhesh3940/TTS.git
cd TTS
```

---

### Step 2 — Backend Setup

**Create and activate a virtual environment**

```bash
python -m venv .venv311
# Windows
.venv311\Scripts\activate
# macOS/Linux
source .venv311/bin/activate
```

**Install Python dependencies**

```bash
pip install -r requirements.txt
```

**Download NLTK data** (required by MeloTTS)

```bash
python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng'); nltk.download('cmudict')"
```

---

### Step 3 — Install ffmpeg

ffmpeg is required for voice cloning (audio processing).

**Windows:**
```bash
winget install --id Gyan.FFmpeg -e
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

---

### Step 4 — Download OpenVoice Checkpoints

Run once to download the ~200MB OpenVoice V2 model weights:

```bash
python setup_openvoice.py
```

Checkpoints are saved to `openvoice_checkpoints/checkpoints_v2/`.

---

### Step 5 — Start the backend

```bash
.venv311\Scripts\uvicorn.exe main:app --reload   # Windows
uvicorn main:app --reload                         # macOS/Linux
```

Backend runs at → `http://localhost:8000`

---

### Step 6 — Frontend Setup

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 📖 How to Use

### Text to Speech

1. Select Language, Region, Gender, and Voice
2. Adjust Speed, Pitch, and Volume (optional)
3. Enter your text and click **Generate Speech**
4. Download MP3, VTT, or SRT

### Voice Cloning

1. Go to **Voice Cloning** in the sidebar
2. Upload a reference audio file (WAV or MP3, 6–30 seconds recommended)
3. Enter the text you want spoken in the cloned voice
4. Click **Clone & Generate**
5. Download the cloned WAV output

> First run downloads BERT weights (~400MB) and may take 1–2 minutes.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voices` | Returns full voice database |
| POST | `/api/generate` | Generates speech + subtitles |
| GET | `/api/audio` | Downloads the generated MP3 |
| GET | `/api/srt` | Downloads the generated SRT |
| POST | `/api/clone` | Clones a voice and generates WAV |

### POST `/api/generate`

```json
{
  "text": "Hello world",
  "voice_code": "en-US-AriaNeural",
  "rate": 0,
  "pitch": 0,
  "volume": 0
}
```

### POST `/api/clone`

Multipart form data:
- `text` — text to speak
- `file` — reference audio file (WAV/MP3)

---

## ⚠️ Limitations

- **Internet Required** — edge-tts calls Microsoft's live API
- **No History** — Each generation overwrites `outputs/output.mp3`
- **Single Input** — One text at a time (no batch processing)
- **English Only (Voice Cloning)** — OpenVoice V2 cloning uses EN-Default MeloTTS base
- **First Clone is Slow** — BERT model downloads on first use (~400MB)

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **edge-tts** — Free Python library for Microsoft Edge TTS
- **OpenVoice V2** — MyShell AI voice cloning
- **MeloTTS** — High-quality multilingual TTS by MyShell AI
- **FastAPI** — Modern Python web framework
- **React + Vite** — Fast frontend tooling
