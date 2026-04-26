import asyncio
from pathlib import Path
import warnings
import streamlit as st

warnings.filterwarnings("ignore")

st.set_page_config(page_title="SoundStudio", page_icon="🎧", layout="wide")

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

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
    "Hindi": {"India": {"Female": {"Swara": "hi-IN-SwaraNeural"}, "Male": {"Madhur": "hi-IN-MadhurNeural"}}},
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
    "German": {"Germany": {"Female": {"Katja": "de-DE-KatjaNeural"}, "Male": {"Conrad": "de-DE-ConradNeural"}}},
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


# ── Subtitle helpers ──────────────────────────────────────────────────────────

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
        end_ms   = int((group[-1]["offset"] + group[-1]["duration"]) / 10_000)
        caption  = " ".join(w["text"] for w in group)
        vtt_lines += [f"{_ms_to_vtt(start_ms)} --> {_ms_to_vtt(end_ms)}", caption, ""]
        srt_lines += [str(idx), f"{_ms_to_srt(start_ms)} --> {_ms_to_srt(end_ms)}", caption, ""]
    return "\n".join(vtt_lines), "\n".join(srt_lines)


# ── TTS core ──────────────────────────────────────────────────────────────────

async def generate_speech(text, voice_code, output_file, rate, pitch, volume):
    import edge_tts
    rate_str   = f"+{rate}%"   if rate   >= 0 else f"{rate}%"
    pitch_str  = f"+{pitch}Hz" if pitch  >= 0 else f"{pitch}Hz"
    volume_str = f"+{volume}%" if volume >= 0 else f"{volume}%"

    communicate  = edge_tts.Communicate(text, voice_code,
                                         rate=rate_str, pitch=pitch_str, volume=volume_str)
    audio_chunks = []
    word_events  = []

    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            word_events.append({
                "text":     event["text"],
                "offset":   event["offset"],
                "duration": event["duration"],
            })

    with open(output_file, "wb") as f:
        f.write(b"".join(audio_chunks))

    return build_subtitles(word_events)


# ── Styles ────────────────────────────────────────────────────────────────────

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── Reset & base ── */
html, body, [data-testid="stAppViewContainer"] {
    font-family: 'Inter', system-ui, sans-serif !important;
}
[data-testid="stAppViewContainer"] {
    background: #0f0f0f !important;
}
[data-testid="stHeader"] { background: transparent !important; box-shadow: none !important; }
#MainMenu, footer, [data-testid="stToolbar"] { visibility: hidden !important; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: #111111 !important;
    border-right: 1px solid #1f1f1f !important;
}
[data-testid="stSidebar"] > div { padding-top: 1rem !important; }

/* ── Main area padding ── */
.block-container {
    padding: 2rem 2.5rem 2rem !important;
    max-width: 1200px !important;
}

/* ── Typography ── */
h1, h2, h3, h4, h5, h6,
[data-testid="stMarkdownContainer"] p,
[data-testid="stMarkdownContainer"] h4 {
    color: #f0f0f0 !important;
    font-family: 'Inter', sans-serif !important;
}
label, [data-testid="stWidgetLabel"] p {
    color: #888 !important;
    font-size: 11.5px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

/* ── Selectboxes ── */
[data-testid="stSelectbox"] > div > div {
    background: #1e1e1e !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 8px !important;
    color: #f0f0f0 !important;
    font-size: 13px !important;
}
[data-testid="stSelectbox"] > div > div:focus-within {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15) !important;
}
[data-testid="stSelectbox"] svg { fill: #888 !important; }

/* ── Textarea ── */
[data-testid="stTextArea"] textarea {
    background: #1e1e1e !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 10px !important;
    color: #f0f0f0 !important;
    font-size: 14px !important;
    line-height: 1.65 !important;
    font-family: 'Inter', sans-serif !important;
    resize: vertical !important;
}
[data-testid="stTextArea"] textarea:focus {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.15) !important;
}
[data-testid="stTextArea"] textarea::placeholder { color: #444 !important; }

/* ── Sliders ── */
[data-testid="stSlider"] > div > div > div > div {
    background: #f97316 !important;
}
[data-testid="stSlider"] [data-baseweb="slider"] div[role="slider"] {
    background: #f97316 !important;
    border-color: #f97316 !important;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.25) !important;
}
[data-testid="stSlider"] p { color: #888 !important; font-size: 11px !important; }

/* ── Primary button ── */
[data-testid="stButton"] > button {
    background: #f97316 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 8px !important;
    font-size: 13.5px !important;
    font-weight: 600 !important;
    padding: 0.6rem 1.4rem !important;
    font-family: 'Inter', sans-serif !important;
    transition: opacity 0.18s !important;
    letter-spacing: -0.1px !important;
}
[data-testid="stButton"] > button:hover { opacity: 0.88 !important; }
[data-testid="stButton"] > button:active { opacity: 0.75 !important; }

/* ── Download buttons ── */
[data-testid="stDownloadButton"] > button {
    background: #1a1a1a !important;
    color: #f97316 !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 8px !important;
    font-size: 12.5px !important;
    font-weight: 600 !important;
    font-family: 'Inter', sans-serif !important;
    transition: background 0.18s, border-color 0.18s !important;
}
[data-testid="stDownloadButton"] > button:hover {
    background: rgba(249,115,22,0.12) !important;
    border-color: rgba(249,115,22,0.4) !important;
}

/* ── Audio player ── */
audio {
    width: 100%;
    border-radius: 8px;
    filter: invert(0.85) sepia(0.3) hue-rotate(160deg);
}

/* ── Alerts ── */
[data-testid="stAlert"] {
    border-radius: 8px !important;
    font-size: 13px !important;
}

/* ── Expander ── */
[data-testid="stExpander"] {
    background: #1a1a1a !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 8px !important;
}
[data-testid="stExpander"] summary { color: #888 !important; font-size: 12.5px !important; }

/* ── Code block ── */
[data-testid="stCode"] {
    background: #161616 !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 8px !important;
    font-size: 11.5px !important;
}

/* ── Caption ── */
[data-testid="stCaptionContainer"] p {
    color: #555 !important;
    font-size: 11px !important;
}

/* ── Divider ── */
hr { border-color: #1f1f1f !important; margin: 0.5rem 0 !important; }

/* ── Section header style ── */
.ss-section {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #555;
    margin-bottom: 4px;
}

/* ── Voice code pill ── */
.voice-pill {
    display: inline-block;
    background: rgba(249,115,22,0.12);
    border: 1px solid rgba(249,115,22,0.25);
    color: #f97316;
    border-radius: 99px;
    padding: 2px 10px;
    font-size: 10.5px;
    font-family: 'Courier New', monospace;
    margin-top: 2px;
}

/* ── Output label badges ── */
.out-badge {
    display: inline-block;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    color: #888;
    border-radius: 99px;
    padding: 2px 10px;
    font-size: 10.5px;
    margin-right: 5px;
    margin-bottom: 8px;
}

/* ── Coming soon banner ── */
.coming-soon {
    background: rgba(234,179,8,0.08);
    border: 1px solid rgba(234,179,8,0.2);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12.5px;
    color: #ca8a04;
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
""", unsafe_allow_html=True)


# ── Header ────────────────────────────────────────────────────────────────────

st.markdown("""
<div style="display:flex; align-items:center; gap:14px; margin-bottom:28px;">
  <div style="width:40px;height:40px;background:linear-gradient(135deg,#f97316,#fb923c);
              border-radius:10px;display:flex;align-items:center;justify-content:center;
              font-size:20px;flex-shrink:0;">🎧</div>
  <div>
    <div style="font-size:20px;font-weight:800;color:#f0f0f0;letter-spacing:-0.5px;
                line-height:1.2;">SoundStudio</div>
    <div style="font-size:11.5px;color:#555;margin-top:1px;">
      Neural text-to-speech &nbsp;·&nbsp; 20+ languages &nbsp;·&nbsp; 60+ voices
    </div>
  </div>
  <div style="margin-left:auto;">
    <span style="background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3);
                 color:#f97316;border-radius:99px;padding:3px 10px;font-size:10.5px;
                 font-weight:600;">🎙️ Edge TTS · Neural</span>
  </div>
</div>
""", unsafe_allow_html=True)


# ── Layout ────────────────────────────────────────────────────────────────────

col1, col2 = st.columns([1, 1.8], gap="large")

# ── Left column ───────────────────────────────────────────────────────────────
with col1:
    st.markdown('<p class="ss-section">Voice Settings</p>', unsafe_allow_html=True)

    language   = st.selectbox("Language", sorted(VOICE_DB.keys()), key="lang")
    region     = st.selectbox("Region",   sorted(VOICE_DB[language].keys()), key="region")
    gender     = st.selectbox("Gender",   sorted(VOICE_DB[language][region].keys()), key="gender")
    voices     = VOICE_DB[language][region][gender]
    voice_name = st.selectbox("Voice",    list(voices.keys()), key="voice")
    voice_code = voices[voice_name]

    st.markdown(f'<span class="voice-pill">{voice_code}</span>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<p class="ss-section">Audio Controls</p>', unsafe_allow_html=True)

    rate   = st.slider("Speed",  -50, 100, 0, 5, format="%d%%",  key="rate")
    pitch  = st.slider("Pitch",  -50,  50, 0, 5, format="%dHz",  key="pitch")
    volume = st.slider("Volume", -50,  50, 0, 5, format="%d%%",  key="volume")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<p class="ss-section">Coming Soon</p>', unsafe_allow_html=True)
    st.markdown("""
    <div class="coming-soon">🚧 Voice Cloning requires the React frontend + FastAPI backend.<br>
    Run <code style="font-size:11px;">uvicorn main:app --reload</code> and open
    <code style="font-size:11px;">localhost:5173</code>.</div>
    """, unsafe_allow_html=True)

# ── Right column ──────────────────────────────────────────────────────────────
with col2:
    st.markdown('<p class="ss-section">Script</p>', unsafe_allow_html=True)

    text = st.text_area(
        "script_input",
        height=240,
        placeholder="Type or paste your text here…",
        label_visibility="collapsed",
        key="script",
    )

    char_col, _ = st.columns([1, 3])
    with char_col:
        st.caption(f"{len(text):,} characters")

    if st.button("🎤  Generate Speech", use_container_width=True, key="gen_btn"):
        if not text.strip():
            st.warning("Please enter some text first.")
        else:
            with st.spinner("Synthesising audio…"):
                output_path = str(OUTPUT_DIR / "output.mp3")
                try:
                    vtt, srt = asyncio.run(
                        generate_speech(text, voice_code, output_path, rate, pitch, volume)
                    )
                    st.session_state["audio_path"]  = output_path
                    st.session_state["voice_label"] = f"{voice_name} · {language} ({region}) · {gender}"
                    st.session_state["vtt"]         = vtt
                    st.session_state["srt"]         = srt
                    st.success("✅ Audio ready!")
                except Exception as e:
                    st.error(f"Generation failed: {e}")

    # ── Output section ────────────────────────────────────────────────────────
    if "audio_path" in st.session_state:
        st.markdown("---")
        st.markdown('<p class="ss-section">Output</p>', unsafe_allow_html=True)

        label  = st.session_state.get("voice_label", "")
        badges = "".join(f'<span class="out-badge">{p.strip()}</span>' for p in label.split("·"))
        st.markdown(badges, unsafe_allow_html=True)

        with open(st.session_state["audio_path"], "rb") as f:
            audio_bytes = f.read()

        st.audio(audio_bytes, format="audio/mp3")

        dl1, dl2, dl3 = st.columns(3)
        with dl1:
            st.download_button(
                "⬇ MP3", audio_bytes, "speech.mp3", "audio/mpeg",
                use_container_width=True, key="dl_mp3",
            )
        with dl2:
            st.download_button(
                "⬇ VTT",
                st.session_state.get("vtt", ""),
                "subtitles.vtt", "text/vtt",
                use_container_width=True,
                disabled=not st.session_state.get("vtt"),
                key="dl_vtt",
            )
        with dl3:
            st.download_button(
                "⬇ SRT",
                st.session_state.get("srt", ""),
                "subtitles.srt", "text/plain",
                use_container_width=True,
                disabled=not st.session_state.get("srt"),
                key="dl_srt",
            )

        if st.session_state.get("vtt"):
            with st.expander("📄 Preview captions"):
                st.code(st.session_state["srt"], language=None)
