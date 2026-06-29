"""
seamless_worker.py
Runs in .venv_seamless — called as a subprocess by main.py.
Reads JSON from argv[1]: { input_path, output_path, target_lang }
"""
import sys, json, warnings
warnings.filterwarnings("ignore")

args       = json.loads(sys.argv[1])
input_path = args["input_path"]
output_path= args["output_path"]
target_lang= args["target_lang"]

LANG_CODES = {
    "English":"eng","Hindi":"hin","Tamil":"tam","Telugu":"tel","Bengali":"ben",
    "Marathi":"mar","Gujarati":"guj","Kannada":"kan","Malayalam":"mal","Urdu":"urd",
    "Spanish":"spa","French":"fra","German":"deu","Italian":"ita","Portuguese":"por",
    "Japanese":"jpn","Chinese":"cmn","Korean":"kor","Arabic":"arb","Russian":"rus",
    "Dutch":"nld","Turkish":"tur","Polish":"pol","Swedish":"swe","Indonesian":"ind",
}

tgt = LANG_CODES.get(target_lang)
if not tgt:
    print(f"ERROR: Unknown language: {target_lang}", file=sys.stderr)
    sys.exit(1)

import torch, torchaudio
from transformers import AutoProcessor, SeamlessM4Tv2Model

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[seamless_worker] Loading model on {device}…", flush=True)

processor = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large")
model     = SeamlessM4Tv2Model.from_pretrained("facebook/seamless-m4t-v2-large").to(device)
model.eval()

# Load & resample to 16 kHz mono
waveform, sr = torchaudio.load(input_path)
if sr != 16000:
    waveform = torchaudio.functional.resample(waveform, sr, 16000)
if waveform.shape[0] > 1:
    waveform = waveform.mean(dim=0, keepdim=True)
audio_array = waveform.squeeze().numpy()

print(f"[seamless_worker] Translating to {target_lang} ({tgt})…", flush=True)

inputs = processor(audios=audio_array, sampling_rate=16000, return_tensors="pt").to(device)

with torch.no_grad():
    result = model.generate(**inputs, tgt_lang=tgt, generate_speech=True)

if isinstance(result, tuple):
    speech_tensor, out_sr = result
else:
    speech_tensor = result.waveform
    out_sr = 16000

speech = speech_tensor.squeeze().cpu().float()
torchaudio.save(output_path, speech.unsqueeze(0), out_sr)
print(f"[seamless_worker] Saved to {output_path}", flush=True)
