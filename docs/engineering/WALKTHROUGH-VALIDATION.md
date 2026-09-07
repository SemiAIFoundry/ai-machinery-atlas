# Walkthrough media QA — 2026-09-07

The packaged navigation video and portable reproduction pass the checks below. Browser playback and assistive-technology behavior are handled separately by the main task; these results do not claim a browser or screen-reader test.

## Encoded artifact

Decoded the complete `public/walkthrough/navigation.mp4` using FFmpeg 7.1 (`-hide_banner -nostdin -i … -af volumedetect -f null -`). The decoder exits 0 without media errors:

- Duration: 60.000 seconds; 1,800 video frames.
- Video: H.264 High, progressive yuv420p, 1920 × 1080, 30 frames/s.
- Audio: AAC-LC, 48 kHz, stereo; non-silent score, mean −20.3 dB and peak −6.4 dB.
- MP4 `moov` precedes `mdat`, supporting progressive download.
- SHA-256: `cb42920629f412a848cac1f27cee7faca2fec630760cbac73969fffcb00ea098`.
- The hash matches both the selected capture manifest and public `capture.json`. Both protected public artifacts are unchanged.

The audio statistics validate the presence, decodability and level of the score; they do not substitute for a listening review.

## Capture/content correspondence

Inspected all 17 distinct selected composited images across the 18-entry edit. The first two selected raw captures are byte-identical and hold the same material structure under two explanatory titles. The sequence is correctly described as edited interface captures with reading pauses.

The selected images show grown oxide/deposited film and patterned inspection; memory row-hit state and a 12-die stack; systolic partial/final matrix results; a 15 + 15 adder and placed FPGA resources; hall run/fault accounting; a 4/6 classifier and a supported-but-incorrect retrieved answer; orbital budget/contact constraints; attention, assumed compute/memory-bandwidth growth and dated capacity evidence. The corrected hall, placement, retrieval and growth frames are the selected files.

Tightened chapter text only:

1. Fabrication describes the material structures and inspection actually shown.
2. Orbital states that retained complete products include already delivered products; onboard storage holds the remainder.
3. Progress describes the shown attention result, explicitly assumed 3× compute versus 2× memory-bandwidth growth every two years, and dated capacity boundaries.

These changes are synchronized in `walkthrough.html`, `chapters.json`, `captions.vtt`, `transcript.json` and `transcript.txt`. Baked video text, source interface, curation, `capture.json` and the packaged MP4 were not modified.

## Companion checks

- Eight chapter starts: 0, 9, 17, 25, 32, 40, 48 and 54 seconds; final end 60 seconds.
- Eight caption cues and eight chapter cues match chapter data exactly.
- All eight lesson IDs exist in the current generated lesson catalog.
- All 16 visible lesson links resolve to the atlas root with the appropriate lesson and studio fragment, including when hosted below `/ai-atlas/`.
- HTML, JSON and plain-text transcript paragraphs agree.
- Every relative asset target exists in public or generated dist; Ascent remains a separate link.
- Native controls, captions `default`, no autoplay, and the independent descriptive transcript are present.
- Inline player JavaScript parses successfully.

These are structural/source checks. The main task owns browser seeking, captions presentation and public-host validation.

## Portable reproduction

Added `examples/walkthrough/`: exactly 18 selected raw PNGs, original score/notes, unchanged capture manifest, input checksums, unmodified Geist Latin WOFF2 with its existing SIL OFL, `render.py`, README and output ignore rules. No private filesystem paths or macOS Arial font are distributed. Total kit size at handoff is 13,391,972 bytes across 27 source/input files.

The script defaults to command `ffmpeg` and the included font, with `FFMPEG` and `FONT_FILE` overrides. It preserves the manifest's original `captureBuild`, all capture timestamps, image hashes, titles, captions and durations. It never reads a newer build identity. New output is kept apart from the published artifact. The README explains that original title panels used Arial on macOS and portable Geist rendering can change wrapping and encoded byte identity. The missing arrow glyph in the Latin font subset is drawn as a small vector arrow.

Tested with Python 3.12.14, Pillow 12.3.0 and FFmpeg 7.1:

- `render.py --verify-only` validates all selected input hashes, the contiguous timeline and exact stereo WAV length/format.
- Full rendering and encoding to a fresh temporary directory succeeds. Complete decode confirms the same 60-second/1,800-frame media format and audio levels.
- Reproduction SHA-256: `230df1cedd4b53eb48606046cb633d8d52706dd4dd340024ea404460497ee3c1`.
- Two sampled portable composites inspected: text fits, screenshot content is retained and the arrow renders.
- CaptureBuild and every frame metadata object equal the original manifest. Original and new artifact hashes are recorded separately.
- Independent mutations in disposable copies verify rejection of a modified capture and a non-contiguous timeline, even after updating the outer manifest checksum for the latter.
- Attempts to output into public or an existing output directory are rejected.

Temporary reproduction output: `/tmp/atlas-walkthrough-portable-final-20260907`. The main task may package the repository kit for download; generated temporary media is not needed in that kit.
