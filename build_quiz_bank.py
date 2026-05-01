#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TOPIC_BANK_PATH = ROOT / "docs" / "data" / "topic_bank.json"
QUIZ_OUTPUT_PATH = ROOT / "docs" / "data" / "quiz_questions.json"


def build_questions(topic, peers):
    other_topics = [peer for peer in peers if peer["slug"] != topic["slug"]]
    if len(other_topics) < 3:
        raise ValueError(f"Need at least 4 topics in unit for distractors: {topic['slug']}")

    distractor_topics = other_topics[:3]
    summary_distractors = [peer["summary"] for peer in distractor_topics]
    example_distractors = [peer["example"] for peer in distractor_topics]

    return [
        {
            "id": f"{topic['slug']}-fact",
            "topic": topic["title"],
            "prompt": f"Which topic is best described by this statement? {topic['fact']}",
            "options": [topic["title"], *[peer["title"] for peer in distractor_topics]],
            "answerIndex": 0,
            "explanation": topic["summary"],
        },
        {
            "id": f"{topic['slug']}-summary",
            "topic": topic["title"],
            "prompt": f"Which summary best matches the topic '{topic['title']}'?",
            "options": [topic["summary"], *summary_distractors],
            "answerIndex": 0,
            "explanation": topic["fact"],
        },
        {
            "id": f"{topic['slug']}-example",
            "topic": topic["title"],
            "prompt": f"Which example, term, or cue is most closely associated with '{topic['title']}'?",
            "options": [topic["example"], *example_distractors],
            "answerIndex": 0,
            "explanation": topic["summary"],
        },
    ]


def main():
    topic_bank = json.loads(TOPIC_BANK_PATH.read_text())
    output_units = []

    for unit in topic_bank["units"]:
        topics = unit["topics"]
        questions = []
        for topic in topics:
            questions.extend(build_questions(topic, topics))
        output_units.append(
            {
                "unit": unit["unit"],
                "title": unit["title"],
                "topics": [topic["title"] for topic in topics],
                "questions": questions,
            }
        )

    payload = {
        "course": topic_bank["course"],
        "title": "Self Quiz Question Bank",
        "description": "Multiple-choice review questions aligned to topic clusters within each lecture unit.",
        "units": output_units,
    }
    QUIZ_OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")
    print(f"Wrote {QUIZ_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
