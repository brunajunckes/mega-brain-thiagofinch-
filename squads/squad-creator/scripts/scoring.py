#!/usr/bin/env python3
"""
Base adapter for scoring.py.

Behavior:
- With squad-creator-pro installed: delegate to pro script and preserve output/exit code.
- Without squad-creator-pro: return explicit SKIPPED_PRO_ONLY payload (exit 0).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence


BASE_DIR = Path(__file__).resolve().parent
PRO_SCRIPT = (BASE_DIR / "../../squad-creator-pro/scripts/scoring.py").resolve()


def _wants_json(argv: Sequence[str]) -> bool:
    for index, arg in enumerate(argv):
        if arg == "--output" and index + 1 < len(argv):
            return argv[index + 1].lower() == "json"
        if arg.startswith("--output="):
            return arg.split("=", 1)[1].lower() == "json"
    return False


def _skip_payload(target: str) -> dict:
    return {
        "status": "SKIPPED_PRO_ONLY",
        "scorer": "scoring.py",
        "target": target,
        "reason": "Modular scoring requires squad-creator-pro script set.",
        "fallback": "Use validate-squad.sh for deterministic base score output.",
        "blocking_issues": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    force_no_pro = os.getenv("AIOX_FORCE_NO_PRO", "").lower() in {"1", "true", "yes"}

    if PRO_SCRIPT.exists() and not force_no_pro:
        result = subprocess.run([sys.executable, str(PRO_SCRIPT), *sys.argv[1:]], check=False)
        return result.returncode

    target = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "unspecified"
    payload = _skip_payload(target)
    if _wants_json(sys.argv[1:]):
        print(json.dumps(payload, indent=2))
    else:
        print(f"SKIP: {payload['reason']}")
        print(f"FALLBACK: {payload['fallback']}")
        print(f"TARGET: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
