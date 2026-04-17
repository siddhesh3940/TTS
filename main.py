import asyncio
import os
import warnings
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

warnings.filterwarnings("ignore")

app = FastAPI(title="TTS API")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

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

    return build_subtitles(word_events)


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
