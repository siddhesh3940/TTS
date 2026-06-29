import traceback, sys
from pathlib import Path
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

print("start", flush=True)
try:
    import torch
    print("torch ok", flush=True)
    from openvoice import se_extractor
    from openvoice.api import ToneColorConverter
    print("openvoice ok", flush=True)
    from melo.api import TTS
    print("melo ok", flush=True)

    BASE_DIR = Path("c:/Users/sidva/Desktop/TTS")
    ckpt_dir = BASE_DIR / "openvoice_checkpoints/checkpoints_v2/converter"

    tts = TTS(language="EN", device="cpu")
    spk2id = dict(tts.hps.data.spk2id)
    sid = spk2id.get("EN-Default") or list(spk2id.values())[0]
    base = str(BASE_DIR / "outputs/clone/base_output.wav")
    tts.tts_to_file("Hello world", sid, base, speed=1.0)
    print("base tts ok", flush=True)

    tc = ToneColorConverter(str(ckpt_dir / "config.json"), device="cpu")
    tc.load_ckpt(str(ckpt_dir / "checkpoint.pth"))
    print("converter loaded", flush=True)

    ref = str(BASE_DIR / "sample audio/barack-obama_original.mp3")
    tgt, _ = se_extractor.get_se(ref, tc, vad=True)
    print("target SE ok", flush=True)

    src = torch.load(
        str(BASE_DIR / "openvoice_checkpoints/checkpoints_v2/base_speakers/ses/en-default.pth"),
        map_location="cpu"
    )
    print("source SE ok", flush=True)

    tc.convert(
        audio_src_path=base,
        src_se=src,
        tgt_se=tgt,
        output_path=str(BASE_DIR / "outputs/clone/cloned_output.wav"),
    )
    print("DONE", flush=True)

except Exception:
    traceback.print_exc()
