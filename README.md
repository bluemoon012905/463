# CSE 463 Quiz App

A browser-based multiple-choice quiz tool for reviewing CSE 463 (Interaction Design) lecture material. Covers 24 units and 394 questions generated from lecture slide PDFs.

Live at: `docs/index.html` (GitHub Pages via the `docs/` folder).

## How it works

**Data pipeline**

1. `extract_notes_json.py` — reads every `Notes/*.pdf` with `pdftotext`/`pdfinfo` and writes `Notes/lecture_slides.json` (raw slide text per lecture).
2. A hand-edited `docs/data/topic_bank.json` defines topic clusters (title, slug, fact, summary, example) per unit.
3. `build_quiz_bank.py` — reads `topic_bank.json` and generates `docs/data/quiz_questions.json`. Each topic produces 3 question types (fact ID, summary match, example/term association); distractors are pulled from sibling topics in the same unit.

**Frontend** (`docs/`)

- Pure HTML/CSS/JS, no build step, no dependencies beyond a Google Font.
- `app.js` fetches `quiz_questions.json` at runtime and manages all state in a single `state` object.
- Three hash-routed views: `#home` (unit selector), `#quiz` (active question), `#stats` (history).
- Quiz attempts are persisted in `localStorage` (up to 50 entries).
- Shuffle mode randomizes both question order and answer-choice order on each run.

## Regenerating questions

```bash
# 1. Re-extract slide text (requires poppler: pdftotext, pdfinfo)
python3 extract_notes_json.py

# 2. Edit docs/data/topic_bank.json as needed

# 3. Rebuild the question bank
python3 build_quiz_bank.py
```

## Units covered

Units 1–24, from Introduction to Interaction Design through Haptics III (394 questions total).
