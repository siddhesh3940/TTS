# SoundStudio — Complete Project Context Document

> Hand this file to any AI agent to give full context about the codebase.

---

## 1. Project Overview

**SoundStudio** is a full-stack multilingual audio/voice web application.

- **Repo**: https://github.com/siddhesh3940/TTS.git
- **Local path**: `C:\Users\sidva\Desktop\TTS`
- **Owner**: Sid

### What it does
| Feature | Description |
|---|---|
| Text-to-Speech | 20+ languages, 60+ neural voices via Microsoft Edge TTS |
| Voice Cloning | Clone any voice from a reference audio using OpenVoice V2 + MeloTTS |
| Speech-to-Text | Browser Web Speech API (client-only, no backend) |
| Audio Editor | Client-side waveform trimmer + multi-track merger, exports WAV |
| Voice Translation | Speech-to-speech translation via Meta SeamlessM4T v2 + optional OpenVoice tone transfer |
| AI Chat | Floating chatbot powered by Groq API (Llama/Mixtral/Gemma) |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.11, Uvicorn |
| Frontend | React 18 + Vite 4, React Router DOM v6 |
| TTS Engine | `edge-tts` (Microsoft Azure Neural Voices, free, internet-required) |
| Voice Cloning | OpenVoice V2 (`myshell-openvoice`) + MeloTTS |
| Voice Translation | Meta SeamlessM4T v2 Large (~2.3 GB, HuggingFace) |
| Audio Processing | `pydub` + ffmpeg |
| AI Chat | Groq API (`groq` Python SDK) |
| Styling | Pure CSS custom properties (CSS variables), no CSS framework |

---

## 3. Repository Structure

```
TTS/
├── main.py                    # FastAPI backend — ALL API endpoints
├── seamless_worker.py         # SeamlessM4T subprocess worker (runs in .venv_seamless)
├── setup_openvoice.py         # One-time OpenVoice V2 checkpoint downloader
├── requirements.txt           # Python dependencies for .venv311
├── .env                       # GROQ_API_KEY, GEMINI_API_KEY
├── .gitignore
├── voices.txt                 # Full list of 400+ edge-tts voices
├── outputs/                   # Generated audio (auto-created)
│   ├── output.mp3             # Latest TTS output (overwritten each time)
│   ├── output.srt             # Latest SRT subtitles
│   ├── clone/                 # Voice cloning outputs
│   │   ├── base_output.wav
│   │   ├── cloned_output.wav
│   │   └── ref_*.mp3          # Uploaded reference audio files
│   └── translate/             # Voice translation outputs
├── processed/                 # Cached OpenVoice speaker embeddings (.pth per voice)
├── openvoice_checkpoints/     # OpenVoice V2 model weights (~200 MB)
│   └── checkpoints_v2/
│       ├── converter/         # config.json + checkpoint.pth
│       └── base_speakers/ses/ # en-default.pth (source speaker embedding)
├── sample audio/              # Sample reference audio files
├── .venv311/                  # Main Python virtual environment (Python 3.11)
├── .venv_seamless/            # Isolated venv for SeamlessM4T (avoids dependency conflicts)
└── frontend/
    ├── src/
    │   ├── App.jsx            # Root: Sidebar + Routes + ChatWidget
    │   ├── main.jsx           # ReactDOM.createRoot entry point
    │   ├── index.css          # ALL styles (single CSS file, CSS variables)
    │   ├── App.css            # Empty (styles are in index.css)
    │   ├── components/
    │   │   ├── Sidebar.jsx    # Left navigation sidebar
    │   │   └── ChatWidget.jsx # Floating AI chat panel
    │   ├── hooks/
    │   │   └── useTheme.js    # Dark/light theme toggle (localStorage persisted)
    │   └── pages/
    │       ├── Home.jsx           # Dashboard / landing page
    │       ├── TextToSpeech.jsx   # TTS page
    │       ├── VoiceClone.jsx     # Voice cloning page
    │       ├── SpeechToText.jsx   # Speech-to-text page
    │       ├── AudioEditor.jsx    # Audio editor page
    │       └── VoiceTranslation.jsx # Voice translation page
    ├── .env.development       # VITE_API_URL=http://localhost:8000
    ├── .env.production        # VITE_API_URL for production
    ├── package.json
    ├── vite.config.js
    └── vercel.json            # Vercel deployment config (frontend only)
```

---

## 4. Environment Variables

### Backend (`.env` in project root)
```
GROQ_API_KEY=<groq_api_key>       # Required for /api/chat
GEMINI_API_KEY=<gemini_api_key>   # Present but unused in current code
```

### Frontend (`.env.development`)
```
VITE_API_URL=http://localhost:8000
```
All frontend pages read: `const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'`

---

## 5. Backend — `main.py` Deep Dive

### Startup
- Loads `.env` via `python-dotenv`
- Hardcodes ffmpeg path to Windows WinGet install location:
  `C:\Users\sidva\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_...\bin`
- Patches `pydub` to use that ffmpeg
- Creates `outputs/` and `outputs/clone/` directories if missing

### CORS
```python
allow_origins=["*"]  # Open CORS — all origins allowed
```

### Voice Database (`VOICE_DB`)
Hardcoded Python dict structured as:
```
VOICE_DB = {
  "Language": {
    "Region": {
      "Gender": {
        "Voice Display Name": "edge-tts-voice-code"
      }
    }
  }
}
```
Languages: English (US/UK/AU/IN), Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Urdu, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Korean, Arabic, Russian

### API Endpoints

#### `GET /api/voices`
Returns the full `VOICE_DB` dict as JSON.

#### `POST /api/generate`
Request body:
```json
{
  "text": "string",
  "voice_code": "en-US-AriaNeural",
  "rate": 0,       // -50 to +100 (%)
  "pitch": 0,      // -50 to +50 (Hz)
  "volume": 0      // -50 to +50 (%)
}
```
- Calls `edge_tts.Communicate.stream()` asynchronously
- Collects audio chunks + WordBoundary events
- Writes MP3 to `outputs/output.mp3`
- Builds VTT and SRT subtitle strings from word events (groups of 5 words)
- Writes SRT to `outputs/output.srt`
- Returns: `{ audio_url: "/api/audio", vtt: "...", srt: "..." }`

#### `GET /api/audio`
Returns `outputs/output.mp3` as `audio/mpeg`.

#### `GET /api/srt`
Returns `outputs/output.srt` as `text/plain`.

#### `POST /api/clone`
Multipart form: `text` (str) + `file` (audio file)
1. Saves uploaded file to `outputs/clone/ref_<filename>`
2. Generates base speech via MeloTTS (`EN-Default` speaker)
3. Loads OpenVoice V2 ToneColorConverter from `openvoice_checkpoints/checkpoints_v2/converter/`
4. Extracts target speaker embedding from reference audio (`se_extractor.get_se`)
5. Loads source embedding from `base_speakers/ses/en-default.pth`
6. Converts tone color: base speech → cloned output
7. Returns `outputs/clone/cloned_output.wav` as `audio/wav`

#### `POST /api/translate`
Multipart form: `file` (audio), `target_lang` (str), `clone_voice` (str "true"/"false")
1. Saves input audio to `outputs/translate/input_<filename>`
2. Runs `seamless_worker.py` in `.venv_seamless` as a subprocess with JSON args
3. SeamlessM4T outputs translated speech to `outputs/translate/seamless_out.wav`
4. If `clone_voice=true` and checkpoints exist: applies OpenVoice tone transfer
5. Returns final WAV as `audio/wav`

#### `GET /api/translate/languages`
Returns `{ languages: ["English", "Hindi", ...] }` — 25 languages

#### `POST /api/chat`
Request body:
```json
{
  "messages": [{"role": "user", "content": "..."}],
  "model": "llama-3.3-70b-versatile"
}
```
- Uses Groq Python SDK
- System prompt: "You are a helpful AI assistant inside SoundStudio..."
- Returns: `{ reply: "..." }`
- Supported models: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it`

### Subtitle Generation
```python
def build_subtitles(words, group_size=5):
    # Groups WordBoundary events into 5-word caption blocks
    # Returns (vtt_string, srt_string)
    # Timing from edge-tts offset (100-nanosecond units → divide by 10,000 for ms)
```

### SeamlessM4T Worker (`seamless_worker.py`)
Runs in `.venv_seamless` (separate venv to avoid torch/transformers conflicts):
- Reads args: `{ input_path, output_path, target_lang }`
- Loads `facebook/seamless-m4t-v2-large` from HuggingFace (downloads ~2.3 GB on first run)
- Resamples input to 16kHz mono
- Runs `model.generate(generate_speech=True, tgt_lang=...)`
- Saves output WAV

---

## 6. Frontend Deep Dive

### Entry Point
- `frontend/index.html` → `frontend/src/main.jsx` → `<App />`
- `main.jsx` wraps in `<BrowserRouter>`

### `App.jsx`
```jsx
<div className="app-shell">   // flex row: sidebar + main
  <Sidebar theme={theme} onThemeToggle={toggle} />
  <main className="main-content">
    <Routes>
      <Route path="/"                  → redirect to /home />
      <Route path="/home"              → <Home /> />
      <Route path="/text-to-speech"    → <TextToSpeech /> />
      <Route path="/voice-clone"       → <VoiceClone /> />
      <Route path="/speech-to-text"    → <SpeechToText /> />
      <Route path="/audio-editor"      → <AudioEditor /> />
      <Route path="/voice-translation" → <VoiceTranslation /> />
    </Routes>
  </main>
  <ChatWidget />   // fixed-position floating button + panel
</div>
```

### `Sidebar.jsx`
- Nav items: Home, Text to Speech, Voice Cloning, Speech to Text, Audio Editor, Voice Translation
- "Soon" items (disabled): Sound Effects, Image & Video, Flows, Music
- Bottom: Theme toggle, Developers (soon), Upgrade (soon)
- Pinned section duplicates the 5 active features
- Uses `useNavigate` + `useLocation` for active state

### `useTheme.js`
```js
// Persists to localStorage key 'ss-theme'
// Applies as data-theme="dark|light" on <html> element
// CSS variables switch entire theme
```

### `TextToSpeech.jsx`
State: `voiceDB`, `language`, `region`, `gender`, `voiceName`, `voiceCode`, `rate`, `pitch`, `volume`, `text`, `loading`, `error`, `result`, `showCaptions`

Flow:
1. `useEffect` → fetch `/api/voices`, set first language
2. Cascading `useEffect` chain: language → region → gender → voice
3. Sliders: Speed (-50 to +100%), Pitch (-50 to +50 Hz), Volume (-50 to +50%)
4. `generate()` → POST `/api/generate` → sets `result.audio_url` with cache-busting `?t=timestamp`
5. Downloads: MP3 (blob download), VTT (in-memory text blob), SRT (fetch `/api/srt`)

### `VoiceClone.jsx`
State: `text`, `file`, `loading`, `error`, `audioUrl`

Flow:
1. Drag-and-drop or file input for reference audio
2. `clone()` → FormData POST to `/api/clone`
3. Response is a WAV blob → `URL.createObjectURL`
4. Download as `cloned_speech.wav`

### `SpeechToText.jsx`
- 100% client-side — no backend calls
- Uses `window.SpeechRecognition || window.webkitSpeechRecognition`
- 20 language options
- Modes: Continuous (keep recording) vs Single phrase (auto-stop)
- Shows final transcript (solid) + interim results (italic/muted)
- Actions: Copy to clipboard, Download .txt, Clear
- Stats: word count, character count

### `AudioEditor.jsx`
- 100% client-side — no backend calls
- Loads audio via `FileReader` → `AudioContext.decodeAudioData`
- Multiple tracks supported
- Waveform rendering via `<canvas>` (custom `renderCanvas` function)
  - Orange = selected region; dimmed outside selection
  - Orange handle (left/start), Red handle (right/end) — draggable
  - White playhead during playback
- Playback via `AudioContext` + `AudioBufferSourceNode`
- Export: `OfflineAudioContext` renders all tracks sequentially, custom `encodeWAV()` function
- Output: 44.1 kHz, Stereo, 16-bit WAV

### `VoiceTranslation.jsx`
State: `languages`, `targetLang`, `file`, `cloneVoice`, `loading`, `stage`, `error`, `audioUrl`, `originalUrl`

Flow:
1. Fetch `/api/translate/languages` on mount
2. Language grid — 25 language buttons
3. Voice cloning toggle (uses OpenVoice on backend)
4. POST `/api/translate` with FormData
5. Shows original audio player + translated output player
6. Download translated WAV

### `ChatWidget.jsx`
- Floating `🤖` FAB button (bottom-right, fixed)
- Expands to 340×480px chat panel
- Conversation history maintained in state
- Model selector: Llama 3.3 70B, Mixtral 8x7B, Gemma 2 9B
- POST `/api/chat` with full message history
- Typing indicator animation (3 bouncing dots)
- Enter to send (Shift+Enter for newline)

---

## 7. Styling System (`frontend/src/index.css`)

Single CSS file with CSS custom properties. No Tailwind, no CSS-in-JS, no component library.

### CSS Variables (Dark theme defaults)
```css
--bg-app:        #0f0f0f
--bg-sidebar:    #111111
--bg-card:       #1a1a1a
--bg-input:      #1e1e1e
--bg-panel:      #161616
--border:        #2a2a2a
--text-primary:  #f0f0f0
--text-muted:    #888
--text-faint:    #555
--accent:        #f97316   /* orange */
--accent-dim:    rgba(249, 115, 22, 0.15)
--sidebar-w:     220px
--radius-*:      6px/8px/12px/16px/24px
```

### Light theme overrides
Applied via `html[data-theme="light"] { ... }` selector

### Key CSS Classes
| Class | Purpose |
|---|---|
| `.app-shell` | Root flex container (sidebar + main) |
| `.main-content` | Scrollable main area |
| `.sidebar` | 220px left nav |
| `.tts-layout` | 2-col grid: 290px panel + 1fr main |
| `.tts-panel` | Left settings panel |
| `.tts-main` | Right content panel |
| `.tool-card` | Home page feature cards |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.btn-full` | Button variants |
| `.form-select`, `.form-input` | Form controls |
| `.slider-row` | Label + range input + value display |
| `.drop-zone` | Dashed file upload area |
| `.audio-section` | Audio player + download buttons container |
| `.ae-*` | Audio Editor specific classes |
| `.stt-*` | Speech-to-Text specific classes |
| `.vt-*` | Voice Translation specific classes |
| `.chat-*` | Chat widget classes |
| `.badge`, `.badge-orange`, `.badge-purple` | Small label pills |
| `.soon-tag` | Yellow "Soon" label |
| `.alert`, `.alert-error`, `.alert-success`, `.alert-warn` | Alert boxes |
| `.spinner` | CSS rotation animation |

---

## 8. Dependencies

### Python (`requirements.txt`)
```
fastapi
uvicorn
edge-tts
python-multipart
python-dotenv
torch
torchaudio
openvoice          # myshell-openvoice
melo-tts
groq
pydub
transformers>=4.39.0
sentencepiece
```

### Python (`.venv_seamless` — separate install)
```
torch
torchaudio
transformers==4.40.0
sentencepiece
```

### Node.js (`frontend/package.json`)
```json
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.30.3"
},
"devDependencies": {
  "@vitejs/plugin-react": "^4.0.3",
  "vite": "^4.4.5",
  "eslint": "^8.45.0"
}
```

---

## 9. Running the Project

### Backend
```bash
# Activate main venv
.venv311\Scripts\activate

# Start FastAPI
.venv311\Scripts\uvicorn.exe main:app --reload
# → http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### First-time setup
```bash
# Download OpenVoice V2 checkpoints (~200 MB)
python setup_openvoice.py

# Download NLTK data for MeloTTS
python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng'); nltk.download('cmudict')"

# SeamlessM4T model downloads automatically on first /api/translate call (~2.3 GB)
```

---

## 10. Known Limitations & Design Decisions

| Issue | Detail |
|---|---|
| No output history | Every TTS generation overwrites `outputs/output.mp3` and `output.srt` |
| Hardcoded ffmpeg path | Points to `C:\Users\sidva\AppData\...` — must be changed for other machines |
| English-only cloning | OpenVoice V2 uses `EN-Default` MeloTTS base, so text input must be English for voice cloning |
| SeamlessM4T in subprocess | Runs in `.venv_seamless` to avoid torch/transformers version conflicts with main venv |
| Internet required | `edge-tts` calls Microsoft's live API; no offline TTS fallback |
| First clone is slow | MeloTTS downloads BERT weights (~400 MB) on first run |
| CORS open | `allow_origins=["*"]` — fine for local dev, not for production |
| No auth | No user authentication or API key protection |
| Single user | No multi-tenancy, session isolation, or concurrent request handling |

---

## 11. File Interactions Map

```
Browser
  └─ React frontend (port 5173)
       ├─ /api/voices          ──GET──► main.py → returns VOICE_DB
       ├─ /api/generate        ──POST─► main.py → edge-tts → outputs/output.mp3 + .srt
       ├─ /api/audio           ──GET──► main.py → serves outputs/output.mp3
       ├─ /api/srt             ──GET──► main.py → serves outputs/output.srt
       ├─ /api/clone           ──POST─► main.py → MeloTTS → OpenVoice V2 → cloned_output.wav
       ├─ /api/translate       ──POST─► main.py
       │                                 └─► subprocess: seamless_worker.py (.venv_seamless)
       │                                       └─► SeamlessM4T → seamless_out.wav
       │                                 └─► (optional) OpenVoice V2 tone transfer → translated_*.wav
       ├─ /api/translate/languages ─GET─► main.py → SEAMLESS_LANGS keys
       └─ /api/chat            ──POST─► main.py → Groq API → LLM reply

AudioEditor  (no backend)
  └─ Web Audio API (AudioContext, OfflineAudioContext, Canvas)

SpeechToText (no backend)
  └─ Web Speech API (SpeechRecognition)
```

---

## 12. Pages & Routes Summary

| Route | Component | Backend calls | Notes |
|---|---|---|---|
| `/home` | `Home.jsx` | None | Static dashboard, navigation only |
| `/text-to-speech` | `TextToSpeech.jsx` | `/api/voices`, `/api/generate`, `/api/audio`, `/api/srt` | Core TTS feature |
| `/voice-clone` | `VoiceClone.jsx` | `/api/clone` | Requires OpenVoice checkpoints |
| `/speech-to-text` | `SpeechToText.jsx` | None | Browser Web Speech API only |
| `/audio-editor` | `AudioEditor.jsx` | None | 100% client-side Web Audio API |
| `/voice-translation` | `VoiceTranslation.jsx` | `/api/translate/languages`, `/api/translate` | Requires `.venv_seamless` |

---

## 13. Sidebar Navigation State

| Item | Route | Status |
|---|---|---|
| Home | `/home` | Active |
| Text to Speech | `/text-to-speech` | Active |
| Voice Cloning | `/voice-clone` | Active |
| Speech to Text | `/speech-to-text` | Active |
| Audio Editor | `/audio-editor` | Active |
| Voice Translation | `/voice-translation` | Active |
| Sound Effects | `#` | Soon (disabled) |
| Image & Video | `#` | Soon (disabled) |
| Flows | `#` | Soon (disabled) |
| Music | `#` | Soon (disabled) |
| Developers | `#` | Soon (disabled) |
| Upgrade | `#` | Soon (disabled) |

---

## 14. Theme System

- Toggle button in sidebar bottom
- State managed by `useTheme` hook
- Persisted in `localStorage` key `ss-theme`
- Applied as `data-theme="dark|light"` on `<html>`
- Light mode overrides all CSS variables via `html[data-theme="light"] { ... }`
- Smooth 0.22s transitions on background/border/color properties

---

## 15. Deployment Notes

- `frontend/vercel.json` exists → frontend can be deployed to Vercel
- Set `VITE_API_URL` in `.env.production` to the backend's public URL
- Backend needs a server with Python 3.11, GPU optional (CPU works, slower for cloning/translation)
- ffmpeg must be installed and the path in `main.py` updated
- OpenVoice checkpoints must be downloaded before deployment (`python setup_openvoice.py`)
