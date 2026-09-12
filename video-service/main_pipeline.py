import asyncio
import json
from pathlib import Path

from extract import extract_document
from script_gen import generate_curriculum
from tts import generate_audio
from visual import generate_visual
from assemble import make_slide_clip, assemble_video


def render_scenes_to_video(scenes, job_dir, options=None, extra_metadata=None):
    """Shared rendering core: turns a list of `scene` dicts into a narrated
    MP4. Every scene dict should look like:

        {
            "title": str,
            "narration": str,          # spoken teacher script for this scene
            "keyPoints": [str, ...],   # optional bullet callouts
            "slideType": "standard" | "definition" | "quiz",
            "visual": {"type": str, "title": str, "data": {...}},
        }

    This is used both by the "upload a PDF/PPTX/TXT" flow (after an LLM or
    offline curriculum generator produces the scenes) and by the
    "render an already-authored lecture" flow used by the Teacher Lecture
    Companion app, which already has real per-slide narration scripts.
    """
    options = options or {}
    job = Path(job_dir)
    assets = job / "assets"
    assets.mkdir(parents=True, exist_ok=True)

    if not scenes:
        raise ValueError("No scenes were provided to render into a video.")

    metadata = {
        "totalScenes": len(scenes),
        "scenes": scenes,
    }
    if extra_metadata:
        metadata.update(extra_metadata)
    (job / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    clips = []
    for index, scene in enumerate(scenes):
        script = (scene.get("narration") or "").strip()
        title = scene.get("title", f"Scene {index + 1}")

        if not script:
            script = f"{title}. {scene.get('subtitle', '')}".strip()

        audio_path = assets / f"scene_{index + 1}.wav"
        image_path = assets / f"scene_{index + 1}.png"

        asyncio.run(generate_audio(script, str(audio_path), options.get("voice", "default")))
        generate_visual(title, scene, str(image_path))

        clips.append(make_slide_clip(str(image_path), str(audio_path)))

    output_path = job / "output.mp4"
    try:
        assemble_video(clips, str(output_path))
    finally:
        for clip in clips:
            try:
                if clip.audio:
                    clip.audio.close()
                clip.close()
            except Exception:
                pass

    return str(output_path)


def run_pipeline(input_path: str, job_dir: str, options=None):
    """Upload-a-document flow: extract text, generate a curriculum with an
    LLM (or the offline fallback generator), then render it to video."""
    options = options or {}

    pages = extract_document(input_path)
    if not pages:
        raise ValueError("No readable pages/slides were found in the uploaded file.")

    full_text = "\n\n".join([p.get("text", "").strip() for p in pages if p.get("text", "").strip()]).strip()
    if not full_text:
        raise ValueError("Could not extract readable text from document.")

    # Generate comprehensive educational curriculum with definitions, diagrams, and quizzes
    scenes = generate_curriculum(full_text, options)
    if not scenes:
        raise ValueError("Failed to generate educational video scenes.")

    return render_scenes_to_video(scenes, job_dir, options, extra_metadata={"totalPages": len(pages)})


def _visual_type_from_diagram(diagram_type):
    """Map the Teacher Lecture Companion's VisualDiagram.type onto one of
    the renderer kinds understood by visual.py. We deliberately collapse
    everything to a generic flow/tree/table/chart family so any diagram
    shape the app produces renders without extra plumbing."""
    mapping = {
        "flow": "flowchart",
        "cycle": "flowchart",
        "formula": "flowchart",
        "hierarchy": "tree",
        "comparison": "comparison-table",
        "timeline": "bar-chart",
        "key_metrics": "bar-chart",
    }
    return mapping.get(diagram_type, "flowchart")


def lecture_slide_to_scene(slide, slide_index):
    """Convert a Teacher Lecture Companion `LectureSlide` (see
    src/types.ts) into the generic `scene` dict understood by
    render_scenes_to_video / visual.py."""
    bullets = slide.get("bullets") or []
    key_points = [
        f"{b.get('heading', '').strip()}: {b.get('content', '').strip()}".strip(": ").strip()
        for b in bullets
        if b.get("heading") or b.get("content")
    ]

    diagram = slide.get("visualDiagram") or {}
    elements = diagram.get("elements") or []
    nodes = [
        {"label": el.get("label") or el.get("id") or f"Step {i + 1}"}
        for i, el in enumerate(elements)
    ] or None

    slide_type = "standard"
    scene = {
        "sceneNumber": slide_index + 1,
        "slideType": slide_type,
        "title": slide.get("topicTitle") or slide.get("chapterTitle") or f"Slide {slide_index + 1}",
        "narration": slide.get("teacherScript") or slide.get("subtitle") or "",
        "keyPoints": key_points[:5],
        "visual": {
            "type": _visual_type_from_diagram(diagram.get("type")),
            "title": diagram.get("title") or "Concept Visual",
            "data": {"nodes": nodes} if nodes else {},
        },
    }

    callout = slide.get("calloutBox")
    if callout and callout.get("type") == "definition":
        scene["slideType"] = "definition"
        scene["definition"] = callout.get("text") or scene["narration"]
        scene["intuition"] = slide.get("subtitle") or ""
        scene["whyItMatters"] = callout.get("title") or "Key takeaway for this slide."

    return scene


def run_lecture_pipeline(lecture, job_dir, options=None):
    """Render-an-already-authored-lecture flow used by the Teacher Lecture
    Companion app. `lecture` is the JSON body sent from the frontend and is
    expected to look like the app's `LectureData` type: a `title` plus a
    `slides` array with real narration text already written for each
    slide, so no LLM call is needed here -- only TTS + visuals + assembly.
    """
    options = options or {}
    slides = lecture.get("slides") or []
    if not slides:
        raise ValueError("The lecture has no slides to render.")

    scenes = [lecture_slide_to_scene(slide, i) for i, slide in enumerate(slides)]

    return render_scenes_to_video(
        scenes,
        job_dir,
        options,
        extra_metadata={
            "lectureTitle": lecture.get("title"),
            "subject": lecture.get("subject"),
        },
    )
