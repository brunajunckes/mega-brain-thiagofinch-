#!/usr/bin/env python3
"""Adapter contract tests for base scripts (Base<->Pro coupling)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
BASE_SCRIPTS = REPO_ROOT / "squads" / "squad-creator" / "scripts"


def _run_script(script_name: str, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)

    return subprocess.run(
        [sys.executable, str(BASE_SCRIPTS / script_name), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
        env=merged_env,
    )


def _load_json(stdout: str) -> dict:
    return json.loads(stdout.strip())


def test_scoring_adapter_fallback_json_contract_without_pro() -> None:
    result = _run_script("scoring.py", "squad-creator", "--output", "json", env={"AIOX_FORCE_NO_PRO": "1"})

    assert result.returncode == 0
    payload = _load_json(result.stdout)

    assert payload["status"] == "SKIPPED_PRO_ONLY"
    assert payload["scorer"] == "scoring.py"
    assert payload["blocking_issues"] == 0
    assert payload["fallback"]


def test_coherence_adapter_fallback_json_contract_without_pro() -> None:
    result = _run_script("coherence-validator.py", "--output", "json", env={"AIOX_FORCE_NO_PRO": "1"})

    assert result.returncode == 0
    payload = _load_json(result.stdout)

    assert payload["status"] == "SKIPPED_PRO_ONLY"
    assert payload["validator"] == "coherence-validator.py"
    assert payload["blocking_issues"] == 0
    assert payload["fallback"]


def test_scoring_adapter_delegates_to_pro_when_available() -> None:
    result = _run_script("scoring.py", "--help")

    assert result.returncode == 0
    assert "usage:" in result.stdout.lower()
    assert "SKIPPED_PRO_ONLY" not in result.stdout


def test_coherence_adapter_delegates_to_pro_when_available() -> None:
    result = _run_script("coherence-validator.py", "--help")

    assert result.returncode == 0
    assert "usage:" in result.stdout.lower()
    assert "SKIPPED_PRO_ONLY" not in result.stdout
