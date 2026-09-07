# Inside the machinery: connected learning walkthrough

This companion uses ten actual interface captures from the expanded working atlas, edited into a 60-second sequence with the original **Open Horizons** instrumental score. It is a captured-state edit with reading pauses, not an uninterrupted interaction recording. Chapter links open the actual experiences. Each frame retains the captured build identity and its own pixel hash; the capture record is not relabeled when the atlas changes.

The original navigation walkthrough and The Ascent remain separate companions. This sequence focuses on inspectable data, learned state, verification and recovery, rather than attempting to enumerate every topic.

From the repository root, `python3 examples/connected-walkthrough/render.py --verify-only` checks the selected captures and timeline. To encode, install Pillow and provide `FFMPEG=/path/to/ffmpeg` if it is not on PATH, then run the same script without `--verify-only`. The script refuses an existing output directory. It uses the existing `examples/walkthrough/original-score.wav` and unmodified Geist font in that sibling package; the original notices remain there. A font override uses `FONT_FILE=/path/to/font.ttf`.

Outputs are 1920 × 1080, 30 frames/s, H.264/yuv420p and stereo AAC at 48 kHz. Encoding and font-library versions can change rendered bytes. The reproduction report records input/capture identity separately from the encoded output hash. Atlas-authored source, captures and score retain the project license; the font retains its OFL notice.
