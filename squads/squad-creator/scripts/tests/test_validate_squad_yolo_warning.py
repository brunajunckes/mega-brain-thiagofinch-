#!/usr/bin/env python3
"""Behavior tests for YOLO warning eligibility in validate-squad.sh."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import uuid
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
SQUADS_DIR = REPO_ROOT / "squads"
VALIDATE_SCRIPT = REPO_ROOT / "squads" / "squad-creator" / "scripts" / "validate-squad.sh"


def _strip_ansi(text: str) -> str:
    return re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", text)


def _extract_result_json(stdout: str) -> dict:
    cleaned = _strip_ansi(stdout)
    decoder = json.JSONDecoder()
    found: list[dict] = []

    for index, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            payload, _ = decoder.raw_decode(cleaned[index:])
        except Exception:
            continue
        if isinstance(payload, dict) and "final_score" in payload:
            found.append(payload)

    if not found:
        raise AssertionError("No validation JSON payload found in validator output")

    return found[-1]


def _create_test_squad(name: str, yolo_required: bool) -> Path:
    squad_dir = SQUADS_DIR / name
    (squad_dir / "agents").mkdir(parents=True, exist_ok=False)
    (squad_dir / "outputs").mkdir(parents=True, exist_ok=False)

    config = f"""name: {name}
version: 1.0.0
entry_agent: squad-chief
tested: true
workspace_integration:
  level: none
settings:
  activation:
    yolo_required: {'true' if yolo_required else 'false'}
"""
    (squad_dir / "config.yaml").write_text(config, encoding="utf-8")
    (squad_dir / "agents" / "squad-chief.md").write_text("output_examples: yes\n", encoding="utf-8")
    (squad_dir / "outputs" / "run.txt").write_text("ok\n", encoding="utf-8")
    (squad_dir / "validation-report.md").write_text("validated\n", encoding="utf-8")

    return squad_dir


def _run_validator(squad_name: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", str(VALIDATE_SCRIPT), squad_name, "--quick", "--json"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def test_yolo_warning_not_emitted_when_not_required() -> None:
    squad_name = f"tmp-yolo-off-{uuid.uuid4().hex[:8]}"
    squad_dir = _create_test_squad(squad_name, yolo_required=False)
    try:
        result = _run_validator(squad_name)
        payload = _extract_result_json(result.stdout)

        assert result.returncode == 0
        assert "YOLO required but no state files found" not in result.stdout
        assert payload["deterministic"]["warnings"] == 0
    finally:
        shutil.rmtree(squad_dir, ignore_errors=True)


def test_yolo_warning_emitted_when_required_without_state_files() -> None:
    squad_name = f"tmp-yolo-on-{uuid.uuid4().hex[:8]}"
    squad_dir = _create_test_squad(squad_name, yolo_required=True)
    try:
        result = _run_validator(squad_name)
        payload = _extract_result_json(result.stdout)

        assert result.returncode == 0
        assert "YOLO required but no state files found" in result.stdout
        assert payload["deterministic"]["warnings"] >= 1
    finally:
        shutil.rmtree(squad_dir, ignore_errors=True)
