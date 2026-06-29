import sys
import types
import asyncio
import os
import warnings
import shutil
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
warnings.filterwarnings("ignore")

# Point pydub to real ffmpeg/ffprobe (winget install path)
import pydub.utils as _pydub_utils
from pydub import AudioSegment as _AudioSegment
_FFMPEG_BIN = r"C:\Users\sidva\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin"
_FFMPEG = _FFMPEG_BIN + r"\ffmpeg.exe"
_FFPROBE = _FFMPEG_BIN + r"\ffprobe.exe"
_pydub_utils.get_encoder_name = lambda: _FFMPEG
_pydub_utils.get_prober_name = lambda: _FFPROBE
_AudioSegment.converter = _FFMPEG
_AudioSegment.ffmpeg = _FFMPEG
_AudioSegment.ffprobe = _FFPROBE

app = FastAPI(title="TTS API")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)
CLONE_DIR = BASE_DIR / "outputs/clone"
CLONE_DIR.mkdir(exist_ok=True)

# ── Voice Database ─────────────────────────────────────────────────────────────
VOICE_DB = {
    "English": {
        "United States": {
            "Female": {
                "Aria — Natural, Conversational": "en-US-AriaNeural",
                "Jenny — Friendly": "en-US-JennyNeural",
                "Michelle — Warm": "en-US-MichelleNeural",
            },
            "Male": {
                "Guy — Casual": "en-US-GuyNeural",
                "Steffan — Deep": "en-US-SteffanNeural",
                "Christopher — Confident": "en-US-ChristopherNeural",
                "Eric — Clear": "en-US-EricNeural",
                "Roger — Bold": "en-US-RogerNeural",
            },
        },
        "United Kingdom": {
            "Female": {
                "Sonia — British": "en-GB-SoniaNeural",
                "Libby — Bright": "en-GB-LibbyNeural",
                "Maisie — Soft": "en-GB-MaisieNeural",
            },
            "Male": {
                "Ryan — Natural": "en-GB-RyanNeural",
                "Thomas — Formal": "en-GB-ThomasNeural",
            },
        },
        "Australia": {
            "Female": {"Natasha": "en-AU-NatashaNeural"},
            "Male": {"William": "en-AU-WilliamNeural"},
        },
        "India": {
            "Female": {"Neerja": "en-IN-NeerjaNeural"},
            "Male": {"Prabhat": "en-IN-PrabhatNeural"},
        },
    },
    "Hindi": {
        "India": {
            "Female": {"Swara": "hi-IN-SwaraNeural"},
            "Male": {"Madhur": "hi-IN-MadhurNeural"},
        }
    },
    "Tamil": {
        "India": {"Female": {"Pallavi": "ta-IN-PallaviNeural"}, "Male": {"Valluvar": "ta-IN-ValluvarNeural"}},
        "Malaysia": {"Female": {"Kani": "ta-MY-KaniNeural"}, "Male": {"Surya": "ta-MY-SuryaNeural"}},
    },
    "Telugu": {"India": {"Female": {"Shruti": "te-IN-ShrutiNeural"}, "Male": {"Mohan": "te-IN-MohanNeural"}}},
    "Bengali": {
        "India": {"Female": {"Tanishaa": "bn-IN-TanishaaNeural"}, "Male": {"Bashkar": "bn-IN-BashkarNeural"}},
        "Bangladesh": {"Female": {"Nabanita": "bn-BD-NabanitaNeural"}, "Male": {"Pradeep": "bn-BD-PradeepNeural"}},
    },
    "Marathi": {"India": {"Female": {"Aarohi": "mr-IN-AarohiNeural"}, "Male": {"Manohar": "mr-IN-ManoharNeural"}}},
    "Gujarati": {"India": {"Female": {"Dhwani": "gu-IN-DhwaniNeural"}, "Male": {"Niranjan": "gu-IN-NiranjanNeural"}}},
    "Kannada": {"India": {"Female": {"Sapna": "kn-IN-SapnaNeural"}, "Male": {"Gagan": "kn-IN-GaganNeural"}}},
    "Malayalam": {"India": {"Female": {"Sobhana": "ml-IN-SobhanaNeural"}, "Male": {"Midhun": "ml-IN-MidhunNeural"}}},
    "Urdu": {
        "India": {"Female": {"Gul": "ur-IN-GulNeural"}, "Male": {"Salman": "ur-IN-SalmanNeural"}},
        "Pakistan": {"Female": {"Uzma": "ur-PK-UzmaNeural"}, "Male": {"Asad": "ur-PK-AsadNeural"}},
    },
    "Spanish": {
        "Spain": {"Female": {"Elvira": "es-ES-ElviraNeural"}, "Male": {"Alvaro": "es-ES-AlvaroNeural"}},
        "Mexico": {"Female": {"Dalia": "es-MX-DaliaNeural"}, "Male": {"Jorge": "es-MX-JorgeNeural"}},
    },
    "French": {
        "France": {"Female": {"Denise": "fr-FR-DeniseNeural"}, "Male": {"Henri": "fr-FR-HenriNeural"}},
        "Canada": {"Female": {"Sylvie": "fr-CA-SylvieNeural"}, "Male": {"Jean": "fr-CA-JeanNeural"}},
    },
    "German": {
        "Germany": {"Female": {"Katja": "de-DE-KatjaNeural"}, "Male": {"Conrad": "de-DE-ConradNeural"}},
    },
    "Italian": {"Italy": {"Female": {"Elsa": "it-IT-ElsaNeural"}, "Male": {"Diego": "it-IT-DiegoNeural"}}},
    "Portuguese": {
        "Brazil": {"Female": {"Francisca": "pt-BR-FranciscaNeural"}, "Male": {"Antonio": "pt-BR-AntonioNeural"}},
        "Portugal": {"Female": {"Raquel": "pt-PT-RaquelNeural"}, "Male": {"Duarte": "pt-PT-DuarteNeural"}},
    },
    "Japanese": {"Japan": {"Female": {"Nanami": "ja-JP-NanamiNeural"}, "Male": {"Keita": "ja-JP-KeitaNeural"}}},
    "Chinese": {
        "Mainland China": {"Female": {"Xiaoxiao": "zh-CN-XiaoxiaoNeural"}, "Male": {"Yunxi": "zh-CN-YunxiNeural"}},
        "Taiwan": {"Female": {"HsiaoChen": "zh-TW-HsiaoChenNeural"}, "Male": {"YunJhe": "zh-TW-YunJheNeural"}},
    },
    "Korean": {"South Korea": {"Female": {"Sun-Hi": "ko-KR-SunHiNeural"}, "Male": {"InJoon": "ko-KR-InJoonNeural"}}},
    "Arabic": {
        "Saudi Arabia": {"Female": {"Aisha": "ar-SA-AishaNeural"}, "Male": {"Hamed": "ar-SA-HamedNeural"}},
        "Egypt": {"Female": {"Salma": "ar-EG-SalmaNeural"}, "Male": {"Shakir": "ar-EG-ShakirNeural"}},
    },
    "Russian": {"Russia": {"Female": {"Svetlana": "ru-RU-SvetlanaNeural"}, "Male": {"Dmitry": "ru-RU-DmitryNeural"}}},
}


# ── Subtitle helpers ───────────────────────────────────────────────────────────
def _ms_to_vtt(ms: int) -> str:
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def _ms_to_srt(ms: int) -> str:
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_subtitles(words: list, group_size: int = 5) -> tuple:
    if not words:
        return "", ""
    groups = [words[i:i + group_size] for i in range(0, len(words), group_size)]
    vtt_lines = ["WEBVTT", ""]
    srt_lines = []
    for idx, group in enumerate(groups, start=1):
        start_ms = int(group[0]["offset"] / 10_000)
        end_ms = int((group[-1]["offset"] + group[-1]["duration"]) / 10_000)
        caption = " ".join(w["text"] for w in group)
        vtt_lines += [f"{_ms_to_vtt(start_ms)} --> {_ms_to_vtt(end_ms)}", caption, ""]
        srt_lines += [str(idx), f"{_ms_to_srt(start_ms)} --> {_ms_to_srt(end_ms)}", caption, ""]
    return "\n".join(vtt_lines), "\n".join(srt_lines)


async def _generate_speech(text, voice_code, output_file, rate, pitch, volume):
    import edge_tts
    rate_str = f"+{rate}%" if rate >= 0 else f"{rate}%"
    pitch_str = f"+{pitch}Hz" if pitch >= 0 else f"{pitch}Hz"
    volume_str = f"+{volume}%" if volume >= 0 else f"{volume}%"

    communicate = edge_tts.Communicate(text, voice_code, rate=rate_str, pitch=pitch_str, volume=volume_str)
    audio_chunks = []
    word_events = []

    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            word_events.append({
                "text": event["text"],
                "offset": event["offset"],
                "duration": event["duration"],
            })

    with open(output_file, "wb") as f:
        f.write(b"".join(audio_chunks))

    vtt, srt = build_subtitles(word_events)

    srt_path = Path(output_file).parent / "output.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt)

    return vtt, srt


# ── Request/Response Models ────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    voice_code: str
    rate: int = 0
    pitch: int = 0
    volume: int = 0


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/api/voices")
def get_voices():
    return VOICE_DB


@app.post("/api/generate")
async def generate(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    output_path = str(OUTPUT_DIR / "output.mp3")
    try:
        vtt, srt = await _generate_speech(
            req.text, req.voice_code, output_path, req.rate, req.pitch, req.volume
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return JSONResponse({
        "audio_url": "/api/audio",
        "vtt": vtt,
        "srt": srt,
    })


@app.get("/api/audio")
def get_audio():
    audio_path = OUTPUT_DIR / "output.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="No audio generated yet.")
    return FileResponse(str(audio_path), media_type="audio/mpeg", filename="speech.mp3")


# ── Voice Cloning (OpenVoice) ──────────────────────────────────────────────────
@app.post("/api/clone")
async def clone_voice(text: str = Form(...), file: UploadFile = File(...)):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    ref_path = CLONE_DIR / f"ref_{file.filename}"
    with open(ref_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    output_path = str(CLONE_DIR / "cloned_output.wav")
    base_output = str(CLONE_DIR / "base_output.wav")

    try:
        import torch
        from openvoice import se_extractor
        from openvoice.api import ToneColorConverter
        from melo.api import TTS

        ckpt_dir = BASE_DIR / "openvoice_checkpoints/checkpoints_v2/converter"
        if not ckpt_dir.exists():
            raise HTTPException(
                status_code=500,
                detail="OpenVoice checkpoints not found. Run: python setup_openvoice.py"
            )

        device = "cuda" if torch.cuda.is_available() else "cpu"

        # Step 1 — Generate base speech with MeloTTS
        tts_model = TTS(language="EN", device=device)
        spk2id = dict(tts_model.hps.data.spk2id)
        speaker_id = spk2id.get("EN-Default") or list(spk2id.values())[0]
        tts_model.tts_to_file(text, speaker_id, base_output, speed=1.0)

        # Step 2 — Extract tone color from reference audio
        tone_converter = ToneColorConverter(str(ckpt_dir / "config.json"), device=device)
        tone_converter.load_ckpt(str(ckpt_dir / "checkpoint.pth"))

        target_se, _ = se_extractor.get_se(str(ref_path), tone_converter, vad=True)
        source_se = torch.load(str(BASE_DIR / "openvoice_checkpoints/checkpoints_v2/base_speakers/ses/en-default.pth"), map_location=device)

        # Step 3 — Convert tone color
        tone_converter.convert(
            audio_src_path=base_output,
            src_se=source_se,
            tgt_se=target_se,
            output_path=output_path,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return FileResponse(output_path, media_type="audio/wav", filename="cloned_speech.wav")


@app.get("/api/srt")
def get_srt():
    srt_path = OUTPUT_DIR / "output.srt"
    if not srt_path.exists():
        raise HTTPException(status_code=404, detail="No SRT generated yet.")
    return FileResponse(str(srt_path), media_type="text/plain", filename="subtitles.srt")


# ── Voice Translation (SeamlessM4T v2 subprocess + OpenVoice) ───────────────────────────

SEAMLESS_LANGS = {
    "English":"eng","Hindi":"hin","Tamil":"tam","Telugu":"tel","Bengali":"ben",
    "Marathi":"mar","Gujarati":"guj","Kannada":"kan","Malayalam":"mal","Urdu":"urd",
    "Spanish":"spa","French":"fra","German":"deu","Italian":"ita","Portuguese":"por",
    "Japanese":"jpn","Chinese":"cmn","Korean":"kor","Arabic":"arb","Russian":"rus",
    "Dutch":"nld","Turkish":"tur","Polish":"pol","Swedish":"swe","Indonesian":"ind",
}

# Path to the separate SeamlessM4T venv python executable
SEAMLESS_PYTHON = BASE_DIR / ".venv_seamless" / "Scripts" / "python.exe"
SEAMLESS_WORKER = BASE_DIR / "seamless_worker.py"


@app.get("/api/translate/languages")
def get_translate_languages():
    return {"languages": list(SEAMLESS_LANGS.keys())}


@app.post("/api/translate")
async def translate_voice(
    file: UploadFile = File(...),
    target_lang: str = Form(...),
    clone_voice: str = Form(default="true"),
):
    import subprocess, json

    if target_lang not in SEAMLESS_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {target_lang}")

    if not SEAMLESS_PYTHON.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                "SeamlessM4T venv not found. Run: "
                "python -m venv .venv_seamless && "
                ".venv_seamless\\Scripts\\pip.exe install transformers==4.40.0 torch torchaudio sentencepiece"
            )
        )

    trans_dir = BASE_DIR / "outputs" / "translate"
    trans_dir.mkdir(exist_ok=True)
    ref_path     = trans_dir / f"input_{file.filename}"
    out_seamless = str(trans_dir / "seamless_out.wav")
    out_final    = str(trans_dir / "translated_output.wav")

    with open(ref_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        # ── Step 1: Run SeamlessM4T in isolated subprocess ────────────────────────
        worker_args = json.dumps({
            "input_path":  str(ref_path),
            "output_path": out_seamless,
            "target_lang": target_lang,
        })
        proc = subprocess.run(
            [str(SEAMLESS_PYTHON), str(SEAMLESS_WORKER), worker_args],
            capture_output=True, text=True, timeout=600
        )
        if proc.returncode != 0:
            raise HTTPException(status_code=500,
                detail=f"SeamlessM4T failed: {proc.stderr[-1000:]}")

        # ── Step 2: Optional OpenVoice tone-color transfer ────────────────────
        do_clone = clone_voice.lower() in ("true", "1", "yes")
        if do_clone:
            ckpt_dir = BASE_DIR / "openvoice_checkpoints/checkpoints_v2/converter"
            ses_dir  = BASE_DIR / "openvoice_checkpoints/checkpoints_v2/base_speakers/ses"
            if ckpt_dir.exists() and ses_dir.exists():
                import torch
                from openvoice import se_extractor
                from openvoice.api import ToneColorConverter
                device = "cuda" if torch.cuda.is_available() else "cpu"
                tone_converter = ToneColorConverter(str(ckpt_dir / "config.json"), device=device)
                tone_converter.load_ckpt(str(ckpt_dir / "checkpoint.pth"))
                target_se, _ = se_extractor.get_se(str(ref_path), tone_converter, vad=True)
                se_file = ses_dir / "en-default.pth"
                if not se_file.exists():
                    se_file = next(ses_dir.glob("*.pth"), None)
                if se_file:
                    source_se = torch.load(str(se_file), map_location=device)
                    tone_converter.convert(
                        audio_src_path=out_seamless,
                        src_se=source_se,
                        tgt_se=target_se,
                        output_path=out_final,
                    )
                else:
                    shutil.copy(out_seamless, out_final)
            else:
                shutil.copy(out_seamless, out_final)
        else:
            shutil.copy(out_seamless, out_final)

    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Translation timed out (>10 min).")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return FileResponse(
        out_final,
        media_type="audio/wav",
        filename=f"translated_{target_lang.lower()}.wav",
    )


# ── AI Chatbot ────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    messages: list
    model: str = "llama-3.3-70b-versatile"


@app.post("/api/chat")
async def chat(req: ChatRequest):
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=req.model,
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant inside SoundStudio, a text-to-speech and voice cloning app. Be concise and friendly."},
            *req.messages,
        ],
        max_tokens=1024,
    )
    return {"reply": response.choices[0].message.content}
