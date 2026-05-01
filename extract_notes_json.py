#!/usr/bin/env python3

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NOTES_DIR = ROOT / "Notes"
OUTPUT_PATH = NOTES_DIR / "lecture_slides.json"


def run_command(args: list[str]) -> str:
    result = subprocess.run(args, check=True, capture_output=True, text=True)
    return result.stdout


def clean_line(line: str) -> str:
    line = line.replace("\u00a0", " ")
    line = re.sub(r"\s+", " ", line).strip()
    return line


def is_noise_line(line: str, slide_number: int) -> bool:
    if line == str(slide_number):
        return True

    if re.fullmatch(r"f+i+|f+l+|ff+i+|ff+l+", line.lower()):
        return True

    return False


def clean_slide_text(raw_text: str, slide_number: int) -> tuple[str, list[str]]:
    lines: list[str] = []
    seen_blank = False

    for raw_line in raw_text.splitlines():
        line = clean_line(raw_line)
        if not line:
            if lines and not seen_blank:
                lines.append("")
            seen_blank = True
            continue

        if is_noise_line(line, slide_number):
            continue

        seen_blank = False
        lines.append(line)

    while lines and lines[-1] == "":
        lines.pop()

    text = "\n".join(lines)
    non_empty_lines = [line for line in lines if line]
    return text, non_empty_lines


def infer_slide_title(lines: list[str]) -> str | None:
    if not lines:
        return None

    title_parts: list[str] = []
    for line in lines[:3]:
        if re.fullmatch(r"\d+", line):
            continue
        if len(line) <= 120:
            title_parts.append(line)
        if len(title_parts) == 2:
            break

    if not title_parts:
        return None

    return " | ".join(title_parts)


def extract_pdf_text(pdf_path: Path) -> list[str]:
    output = run_command(["pdftotext", "-layout", str(pdf_path), "-"])
    pages = output.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    return pages


def extract_page_count(pdf_path: Path) -> int | None:
    info = run_command(["pdfinfo", str(pdf_path)])
    match = re.search(r"^Pages:\s+(\d+)$", info, flags=re.MULTILINE)
    return int(match.group(1)) if match else None


def lecture_sort_key(path: Path) -> tuple[int, str]:
    match = re.match(r"(\d+)_", path.stem)
    if match:
        return int(match.group(1)), path.name.lower()
    return 10_000, path.name.lower()


def build_record(pdf_path: Path) -> dict:
    raw_pages = extract_pdf_text(pdf_path)
    slides = []

    for index, raw_page in enumerate(raw_pages, start=1):
        text, lines = clean_slide_text(raw_page, index)
        slides.append(
            {
                "slide_number": index,
                "title": infer_slide_title(lines),
                "text": text,
                "lines": lines,
            }
        )

    stem = pdf_path.stem
    lecture_number = None
    lecture_title = stem
    match = re.match(r"(\d+)_(.+)", stem)
    if match:
        lecture_number = int(match.group(1))
        lecture_title = match.group(2)

    return {
        "source_file": str(pdf_path.relative_to(ROOT)),
        "filename": pdf_path.name,
        "lecture_number": lecture_number,
        "lecture_title": lecture_title,
        "page_count": extract_page_count(pdf_path),
        "slide_count": len(slides),
        "slides": slides,
    }


def main() -> None:
    pdf_paths = sorted(NOTES_DIR.glob("*.pdf"), key=lecture_sort_key)
    records = [build_record(path) for path in pdf_paths]

    payload = {
        "generated_from": str(NOTES_DIR.relative_to(ROOT)),
        "lecture_count": len(records),
        "lectures": records,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
