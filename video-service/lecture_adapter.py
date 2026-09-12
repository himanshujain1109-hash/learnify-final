"""
Adapts a "Remix Teacher Lecture Video Generator" lecture object (produced by
the Gemini-powered /api/generate-lecture endpoint in the Node/Express server)
into the `scene` dict shape that tts.py / visual.py / assemble.py already
know how to render.

This lets the video-service render a real MP4 straight from a lecture that
was already generated in the browser, without re-running document extraction
or curriculum generation (extract.py / script_gen.py), which are only needed
for the raw-file-upload flow.
"""

from typing import Any, Dict, List


def _bullet_text(bullet: Any) -> str:
    if not isinstance(bullet, dict):
        return str(bullet or "").strip()
    heading = str(bullet.get("heading") or "").strip()
    content = str(bullet.get("content") or "").strip()
    if heading and content:
        return f"{heading}: {content}"
    return heading or content


def _slide_narration(slide: Dict[str, Any]) -> str:
    segments = slide.get("scriptSegments") or []
    texts = [
        str(seg.get("text", "")).strip()
        for seg in segments
        if isinstance(seg, dict) and str(seg.get("text", "")).strip()
    ]
    if texts:
        return " ".join(texts)

    fallback = slide.get("teacherScript") or slide.get("subtitle") or ""
    return str(fallback).strip()


def _visual_from_diagram(diagram: Any) -> Dict[str, Any]:
    if not isinstance(diagram, dict):
        return {"type": "flowchart", "title": "Visual Overview", "data": {}}

    elements = diagram.get("elements") or []
    nodes = []
    for element in elements:
        if not isinstance(element, dict):
            continue
        label = element.get("label") or element.get("sublabel") or element.get("badge")
        if label:
            nodes.append({"label": str(label)})

    return {
        "type": "flowchart",
        "title": diagram.get("title") or "Visual Overview",
        "data": {"nodes": nodes} if nodes else {},
    }


def build_scenes_from_lecture(lecture: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Builds one render-ready scene per lecture slide."""
    if not isinstance(lecture, dict):
        return []

    slides = lecture.get("slides") or []
    scenes: List[Dict[str, Any]] = []

    for slide in slides:
        if not isinstance(slide, dict):
            continue

        bullets = slide.get("bullets") or []
        key_points = [text for text in (_bullet_text(b) for b in bullets) if text]

        narration = _slide_narration(slide)
        if not narration:
            narration = str(slide.get("subtitle") or slide.get("topicTitle") or "").strip()

        scenes.append(
            {
                "title": slide.get("topicTitle")
                or slide.get("chapterTitle")
                or lecture.get("title")
                or "Lecture",
                "narration": narration,
                "keyPoints": key_points,
                "slideType": "concept",
                "visual": _visual_from_diagram(slide.get("visualDiagram")),
            }
        )

    if not scenes:
        scenes.append(
            {
                "title": lecture.get("title") or "Lecture",
                "narration": str(lecture.get("overviewSummary") or "").strip(),
                "keyPoints": [],
                "slideType": "concept",
                "visual": {"type": "flowchart", "title": "Overview", "data": {}},
            }
        )

    return scenes
