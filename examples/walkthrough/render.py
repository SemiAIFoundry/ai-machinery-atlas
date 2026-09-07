#!/usr/bin/env python3
"""Reproduce the published 60-second edit from its preserved UI captures.

Requires Python 3.10+, Pillow and FFmpeg with libx264/AAC. The published
capture manifest is evidence: never replace it with a current build identity.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import wave

HERE = Path(__file__).resolve().parent


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_inputs() -> dict:
    expected = json.loads((HERE / "input-checksums.json").read_text())
    for name, digest in expected.items():
        if sha256(HERE / name) != digest:
            raise ValueError(f"Input checksum mismatch: {name}")
    manifest = json.loads((HERE / "capture-manifest.json").read_text())
    frames = manifest["frames"]
    if len(frames) != 18 or manifest["durationS"] != 60:
        raise ValueError("Expected the preserved 18-capture, 60-second edit")
    if manifest["resolution"] != [1920, 1080] or manifest["fps"] != 30:
        raise ValueError("Unexpected published output dimensions or frame rate")
    start = 0
    names = set()
    for row in frames:
        name = row["file"]
        if Path(name).name != name or name in names:
            raise ValueError(f"Invalid or repeated capture filename: {name}")
        names.add(name)
        if row["start"] != start or row["duration"] <= 0:
            raise ValueError(f"Non-contiguous timeline at {name}")
        if row["end"] != row["start"] + row["duration"]:
            raise ValueError(f"Inconsistent duration at {name}")
        if sha256(HERE / "frames" / name) != row["sha256"]:
            raise ValueError(f"Capture checksum mismatch: {name}")
        start = row["end"]
    if start != manifest["durationS"]:
        raise ValueError("Capture timeline does not end at 60 seconds")
    actual_names = {p.name for p in (HERE / "frames").iterdir() if p.is_file()}
    if actual_names != names:
        raise ValueError("The frames directory must contain exactly the selected captures")
    with wave.open(str(HERE / "original-score.wav"), "rb") as score:
        if (score.getnchannels(), score.getframerate(), score.getsampwidth(),
                score.getnframes()) != (2, 48000, 2, 2880000):
            raise ValueError("Expected the 60-second stereo 48 kHz/16-bit original score")
    return manifest


def draw_lines(draw, text, x, y, font, width, fill, spacing=10):
    line = ""
    for word in text.split():
        candidate = (line + " " + word).strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] > width and line:
            draw.text((x, y), line, font=font, fill=fill)
            y += font.size + spacing
            line = word
        else:
            line = candidate
    if line:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + spacing
    return y


def render_frames(manifest, output, font_path):
    from PIL import Image, ImageDraw, ImageFont
    try:
        ImageFont.truetype(str(font_path), 22)
    except OSError as error:
        raise RuntimeError("Cannot load FONT_FILE. The bundled Geist WOFF2 needs "
                           "Pillow/FreeType with WOFF2 support; set FONT_FILE to "
                           "an available licensed TTF/OTF if needed.") from error
    font = lambda size: ImageFont.truetype(str(font_path), size)
    rendered = output / "rendered"
    rendered.mkdir()
    for index, row in enumerate(manifest["frames"]):
        canvas = Image.new("RGB", (1920, 1080), "#07131c")
        draw = ImageDraw.Draw(canvas)
        draw.rectangle((0, 0, 480, 1080), fill="#0d222e")
        draw.rounded_rectangle((48, 56, 116, 61), radius=2, fill="#99e2c3")
        draw.text((48, 88), "AI MACHINERY ATLAS", font=font(22), fill="#b5d7d9")
        draw.text((48, 190), row["chapter"], font=font(22), fill="#90d8bc")
        y = draw_lines(draw, row["title"], 48, 240, font(45), 390, "#f0f5ee", 12)
        bottom = draw_lines(draw, row["caption"], 48, y + 40, font(26), 386,
                            "#aac5cf", 12)
        if bottom > 820:
            raise ValueError(f"FONT_FILE makes caption overflow: {row['file']}")
        # The bundled Latin subset omits U+2192. Draw the same right arrow
        # geometrically so a missing-glyph box cannot enter the portable edit.
        tagline_font = font(20)
        draw.text((48, 852), "ATOMS", font=tagline_font, fill="#94ccbb")
        arrow_x = 48 + draw.textlength("ATOMS ", font=tagline_font)
        arrow_y = 866
        draw.line((arrow_x, arrow_y, arrow_x + 17, arrow_y), fill="#94ccbb", width=1)
        draw.line((arrow_x + 12, arrow_y - 4, arrow_x + 17, arrow_y,
                   arrow_x + 12, arrow_y + 4), fill="#94ccbb", width=1)
        draw.text((arrow_x + 24, 852), "INTELLIGENCE", font=tagline_font, fill="#94ccbb")
        draw_lines(draw, "semiaifoundry.com / ai-atlas", 48, 915, font(20), 385,
                   "#afc6d0", 7)
        draw.text((48, 1003), "Semi AI Foundry, LLC", font=font(17), fill="#8faab9")
        with Image.open(HERE / "frames" / row["file"]) as source:
            screen = source.convert("RGB")
        screen.thumbnail((1392, 990), Image.Resampling.LANCZOS)
        canvas.paste(screen, (504 + (1392 - screen.width) // 2,
                             38 + (990 - screen.height) // 2))
        draw.rectangle((504, 1047, 1896, 1051), fill="#213943")
        draw.rectangle((504, 1047, 504 + int(1392 * row["end"] / 60), 1051),
                       fill="#9cdec3")
        canvas.save(rendered / f"{index:03}.png")
    # Relative concat paths also work when the checkout path contains spaces.
    concat = "".join(f"file 'rendered/{i:03}.png'\nduration {row['duration']}\n"
                     for i, row in enumerate(manifest["frames"]))
    (output / "frames.txt").write_text(concat + "file 'rendered/017.png'\n")
    with Image.open(rendered / "004.png") as poster:
        poster.save(output / "poster.jpg", quality=90)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true",
                        help="Verify inputs and timing without Pillow or FFmpeg")
    parser.add_argument("--render-only", action="store_true",
                        help="Create all captioned PNGs and poster without encoding")
    parser.add_argument("--output", type=Path, default=HERE / "output",
                        help="New output directory; existing directories are refused")
    args = parser.parse_args()
    manifest = verify_inputs()
    if args.verify_only:
        print("Verified 18 capture hashes, contiguous 60-second edit, original score and font.")
        return
    output = args.output.resolve()
    repo_public = HERE.parent.parent / "public"
    if output == repo_public or repo_public in output.parents:
        parser.error("Reproduction output must be outside public; the published media is immutable")
    if output.exists():
        parser.error("Output already exists; choose a new directory to preserve prior outputs")
    font_path = Path(os.environ.get("FONT_FILE", str(HERE / "fonts/geist-latin.woff2"))).resolve()
    if not font_path.is_file():
        parser.error("FONT_FILE is not an existing font file")
    output.mkdir(parents=True)
    render_frames(manifest, output, font_path)
    report = {
        "method": manifest["method"],
        "durationS": manifest["durationS"], "resolution": manifest["resolution"],
        "fps": manifest["fps"], "captureBuild": manifest["captureBuild"],
        "frames": manifest["frames"], "music": manifest["music"],
        "publishedArtifactSha256": manifest["artifactSha256"],
        "font": {"filename": font_path.name, "sha256": sha256(font_path)},
        "note": "Published titles used macOS Arial. Portable reproduction uses the selected font. "
                "Timing, capture pixels and text are preserved; line wrapping and encoded bytes may differ."
    }
    if not args.render_only:
        ffmpeg = os.environ.get("FFMPEG", "ffmpeg")
        version = subprocess.run([ffmpeg, "-version"], check=True,
                                 capture_output=True, text=True).stdout.splitlines()[0]
        command = [ffmpeg, "-n", "-hide_banner", "-nostdin", "-f", "concat", "-safe", "0",
                   "-i", str(output / "frames.txt"), "-i", str(HERE / "original-score.wav"),
                   "-t", "60", "-vf", "fps=30,format=yuv420p",
                   "-af", "volume=0.6,afade=t=in:st=0:d=0.5,afade=t=out:st=57.5:d=2.5",
                   "-c:v", "libx264", "-preset", "fast", "-crf", "19",
                   "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                   str(output / "navigation.mp4")]
        with (output / "encode.log").open("w") as log:
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=log)
        report["encoder"] = version
        report["artifactSha256"] = sha256(output / "navigation.mp4")
    (output / "reproduction.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"durationS": 60, "captures": 18,
                      "encoded": not args.render_only,
                      "artifactSha256": report.get("artifactSha256")}))


if __name__ == "__main__":
    main()
