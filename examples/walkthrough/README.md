# Reproduce the navigation walkthrough

These are the 18 selected raw atlas interface captures, the original instrumental score, and the exact 60-second edit used for **Follow the machinery**. The sequence consists of captured interface states edited with reading pauses. It is not an uninterrupted screen recording. The first two selected captures deliberately retain the same image under different explanatory titles.

`capture-manifest.json` preserves each image's SHA-256, capture timestamp, title, caption and time interval, plus the captured build's identity. It also records the original encoded MP4 hash. The renderer reads this preserved identity; it never substitutes a newly built atlas or the current Git checkout. No user-specific filesystem paths are included in the kit.

## Run

From the repository root, verify every input without installing media dependencies:

```sh
python3 examples/walkthrough/render.py --verify-only
```

To render, use Python 3.10 or later, Pillow with FreeType/WOFF2 support, and an FFmpeg installation that includes `libx264` and AAC encoding. Install Pillow in your chosen Python environment if needed:

```sh
python3 -m pip install Pillow
python3 examples/walkthrough/render.py
```

The default output is a new `examples/walkthrough/output/` directory containing 18 composited PNGs, a poster, the MP4, encoder log and `reproduction.json`. Existing output directories are refused. The packaged `public/walkthrough/navigation.mp4` and its identity are never overwritten. To inspect the composites without FFmpeg, use `--render-only`.

Both external tools can be selected explicitly; each environment value is a path, not a shell command with arguments:

```sh
FFMPEG=/path/to/ffmpeg FONT_FILE=/path/to/licensed-font.ttf \
  python3 examples/walkthrough/render.py --output /path/to/new-output
```

The default `FONT_FILE` is the included, unmodified Geist Latin WOFF2; its SIL Open Font License is in `fonts/OFL.txt`. Pillow builds lacking WOFF2 support can use the override with a compatible TTF or OTF. No macOS font is distributed. The original encoded title panels used Arial on macOS; this portable rendering uses Geist. Screenshot pixels, text and timing are preserved, but title line wrapping and encoded byte identity depend on the font, Pillow/FreeType and FFmpeg versions. `reproduction.json` distinguishes the original encoded hash from the newly rendered artifact hash and records the chosen font hash and encoder version.

The output remains 1920 × 1080 at 30 frames/s, H.264/yuv420p with stereo AAC at 48 kHz. The original 60-second score receives the same 0.6 volume factor, opening fade and final 2.5-second fade as the original encoded version. `original-score-notes.txt` describes its authorship and composition. The repository's project license applies to authored captures, score and rendering code; the bundled font retains its OFL license.

## Edit boundaries

| Chapter | Seconds |
| --- | --- |
| Fabrication | 0–9 |
| Memory | 9–17 |
| Architecture | 17–25 |
| Realization | 25–32 |
| Operating hall | 32–40 |
| Applications | 40–48 |
| Orbital | 48–54 |
| Progress | 54–60 |

The accessible playback companion and its descriptive captions/transcript are in `public/walkthrough.html` and `public/walkthrough/`. The longer **Ascent** film is a separate companion. This kit recreates the captured walkthrough; it does not recapture current interface behavior.
