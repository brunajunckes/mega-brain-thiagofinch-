#!/usr/bin/env python3
"""
Email Enrichment Script for Local Business Leads
=================================================
Finds contact emails for leads that don't have websites, using:
  1. Hunter.io domain search API (if --hunter-key provided)
  2. Pattern guessing (slug-based domain + common prefixes)
  3. Optional SMTP mailbox verification

Usage:
  python3 enrich-emails.py                    # enrich all leads without email
  python3 enrich-emails.py --hunter-key KEY   # use Hunter.io API
  python3 enrich-emails.py --max 10           # enrich up to 10 leads
  python3 enrich-emails.py --niche roofing    # filter by niche
  python3 enrich-emails.py --pattern-only     # skip API, only pattern guessing
  python3 enrich-emails.py --report           # print current enrichment report
  python3 enrich-emails.py --verify-smtp      # enable SMTP verification step
"""

import argparse
import json
import os
import re
import smtplib
import socket
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import urllib.request
import urllib.parse
import urllib.error

# ── Paths ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
LEADS_FILE = SCRIPT_DIR / "leads.json"
REPORT_FILE = SCRIPT_DIR / "enrichment-report.json"

# ── Constants ────────────────────────────────────────────────────────────────

HUNTER_API_BASE = "https://api.hunter.io/v2"
HUNTER_RATE_LIMIT_SLEEP = 1.0  # seconds between Hunter.io requests

EMAIL_PREFIXES = [
    "info",
    "contact",
    "hello",
    "office",
    "admin",
    "mail",
    "support",
]

SMTP_TIMEOUT = 5  # seconds
SMTP_SENDER = "verify@example.com"


# ── Slug / domain helpers ─────────────────────────────────────────────────────


def _normalize_char(c: str) -> str:
    """Convert accented chars to ASCII equivalent."""
    return unicodedata.normalize("NFKD", c).encode("ascii", "ignore").decode("ascii")


def business_to_slug(name: str) -> str:
    """
    Convert a business name to a URL-safe slug.

    Examples:
      "Arctic Air HVAC"       → "arcticairhvac"
      "Springtree Restoration - Allen, TX" → "springtreerestoration"
      "T Rock Roofing & Contracting"       → "trockroofing"
    """
    # Strip city/state suffixes like " - Allen, TX" or ", Dallas TX"
    name = re.split(r"\s[-–]\s|\s*,\s*[A-Z]{2}$", name)[0]
    # Remove common legal suffixes that inflate the slug
    # Only strip legal/article noise — keep descriptive industry words (restoration, roofing, etc.)
    name = re.sub(
        r"\b(llc|inc|corp|co|ltd|and|the|of|&)\b",
        "",
        name,
        flags=re.IGNORECASE,
    )
    # Normalize unicode, lowercase, keep only alphanumeric
    slug = "".join(_normalize_char(c) for c in name.lower())
    slug = re.sub(r"[^a-z0-9]", "", slug)
    return slug.strip()


def candidate_domains(name: str) -> list[str]:
    """
    Generate a prioritized list of candidate domains for a business name.
    Returns unique, non-empty entries.
    """
    slug = business_to_slug(name)
    if not slug:
        return []

    # Full slug first, then progressively simpler variants
    seen: set[str] = set()
    domains: list[str] = []

    def add(d: str) -> None:
        if d and d not in seen:
            seen.add(d)
            domains.append(d)

    add(f"{slug}.com")
    add(f"{slug}llc.com")
    add(f"{slug}inc.com")
    add(f"{slug}co.com")

    # Also try with hyphen from original name words
    words = re.sub(r"[^a-z0-9\s]", "", name.lower()).split()
    # Remove single-char words and stop words
    stop = {"a", "an", "the", "and", "or", "of", "in", "at", "llc", "inc", "co", "ltd", "corp"}
    words = [w for w in words if len(w) > 1 and w not in stop]
    if words:
        hyphen_slug = "-".join(words[:4])  # max 4 words
        add(f"{hyphen_slug}.com")

    return domains


def guess_emails(name: str) -> list[dict]:
    """
    Build a list of guessed email candidates with confidence metadata.
    Returns dicts with keys: email, domain, prefix.
    """
    domains = candidate_domains(name)
    results = []
    for domain in domains:
        for prefix in EMAIL_PREFIXES:
            results.append(
                {
                    "email": f"{prefix}@{domain}",
                    "domain": domain,
                    "prefix": prefix,
                }
            )
    return results


# ── Hunter.io ────────────────────────────────────────────────────────────────


def hunter_domain_search(domain: str, api_key: str) -> Optional[dict]:
    """
    Query Hunter.io domain-search endpoint.
    Returns parsed JSON response or None on error.
    """
    params = urllib.parse.urlencode({"domain": domain, "api_key": api_key})
    url = f"{HUNTER_API_BASE}/domain-search?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "aiox-enrich/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            print(f"  [hunter] Rate limit hit for {domain} — sleeping 60s")
            time.sleep(60)
        elif exc.code == 401:
            print("  [hunter] Invalid API key — disabling Hunter.io for this run")
            return {"_disable": True}
        else:
            print(f"  [hunter] HTTP {exc.code} for {domain}")
    except Exception as exc:
        print(f"  [hunter] Error querying {domain}: {exc}")
    return None


def extract_best_email_from_hunter(data: dict) -> Optional[str]:
    """
    Pick the best email from Hunter.io domain-search response.
    Prefers generic emails (info@, contact@, office@, admin@) over personal.
    """
    emails = data.get("data", {}).get("emails", [])
    if not emails:
        return None

    generic_prio = list(EMAIL_PREFIXES)

    # Score each email — generic ones win
    def score(entry: dict) -> int:
        addr = entry.get("value", "")
        local = addr.split("@")[0].lower() if "@" in addr else ""
        try:
            return generic_prio.index(local)
        except ValueError:
            return len(generic_prio)  # personal emails at end

    emails_sorted = sorted(emails, key=score)
    return emails_sorted[0]["value"] if emails_sorted else None


def enrich_via_hunter(name: str, api_key: str) -> Optional[dict]:
    """
    Try Hunter.io for each candidate domain.
    Returns enrichment dict or None.
    """
    for domain in candidate_domains(name):
        print(f"  [hunter] Searching {domain}…")
        result = hunter_domain_search(domain, api_key)
        time.sleep(HUNTER_RATE_LIMIT_SLEEP)

        if result is None:
            continue
        if result.get("_disable"):
            return {"_disable": True}

        email = extract_best_email_from_hunter(result)
        if email:
            return {
                "email": email,
                "email_source": "hunter_io",
                "email_confidence": "medium",
                "email_domain": domain,
            }

    return None


# ── SMTP verification ────────────────────────────────────────────────────────


def _get_mx_host(domain: str) -> Optional[str]:
    """Resolve MX record for domain via a simple DNS query using socket."""
    try:
        # Use nslookup/dig if available, fall back gracefully
        import subprocess

        result = subprocess.run(
            ["dig", "+short", "MX", domain],
            capture_output=True,
            text=True,
            timeout=5,
        )
        lines = [l.strip() for l in result.stdout.strip().splitlines() if l.strip()]
        if lines:
            # Format: "10 mail.example.com."
            mx_entries = []
            for line in lines:
                parts = line.split()
                if len(parts) >= 2:
                    mx_entries.append((int(parts[0]), parts[1].rstrip(".")))
            if mx_entries:
                mx_entries.sort(key=lambda x: x[0])
                return mx_entries[0][1]
    except Exception:
        pass

    # Fallback: assume mail.{domain}
    return f"mail.{domain}"


def smtp_verify(email: str) -> Optional[bool]:
    """
    Attempt SMTP RCPT TO verification without sending email.
    Returns True if accepted, False if rejected, None if inconclusive.
    """
    domain = email.split("@")[-1]
    mx_host = _get_mx_host(domain)
    if not mx_host:
        return None

    try:
        with smtplib.SMTP(timeout=SMTP_TIMEOUT) as smtp:
            smtp.connect(mx_host, 25)
            smtp.helo("verify.example.com")
            smtp.mail(SMTP_SENDER)
            code, _ = smtp.rcpt(email)
            smtp.quit()
            if code == 250:
                return True
            if code in (550, 551, 553):
                return False
    except (socket.timeout, ConnectionRefusedError, smtplib.SMTPException, OSError):
        pass
    return None


# ── Core enrichment logic ─────────────────────────────────────────────────────


def enrich_lead(
    lead: dict,
    hunter_key: Optional[str] = None,
    pattern_only: bool = False,
    verify_smtp: bool = False,
) -> dict:
    """
    Attempt to find an email for a single lead.
    Returns a dict with enrichment fields to merge into the lead,
    or empty dict if nothing found.
    """
    name = lead["name"]
    print(f"Enriching: {name}")

    # 1. Hunter.io
    if hunter_key and not pattern_only:
        result = enrich_via_hunter(name, hunter_key)
        if result and result.get("_disable"):
            print("  [hunter] API key disabled — falling back to pattern guessing")
            hunter_key = None  # disable for remaining leads (caller handles)
        elif result:
            print(f"  ✓ Hunter found: {result['email']}")
            return result

    # 2. Pattern guessing
    candidates = guess_emails(name)
    if not candidates:
        print("  ✗ No candidate domains generated")
        return {}

    # If SMTP verification enabled, test candidates in order
    if verify_smtp:
        for candidate in candidates:
            email = candidate["email"]
            print(f"  [smtp] Verifying {email}…")
            verified = smtp_verify(email)
            if verified is True:
                print(f"  ✓ SMTP verified: {email}")
                return {
                    "email": email,
                    "email_source": "smtp_verified",
                    "email_confidence": "high",
                    "email_domain": candidate["domain"],
                }
            elif verified is False:
                print(f"  ✗ SMTP rejected: {email}")
                continue
            # None = inconclusive, continue to next

    # Fall back to best guess (first candidate = info@{primaryslug}.com)
    best = candidates[0]
    print(f"  ~ Pattern guess: {best['email']}")
    return {
        "email": best["email"],
        "email_source": "pattern_guess",
        "email_confidence": "low",
        "email_domain": best["domain"],
    }


# ── Persistence helpers ───────────────────────────────────────────────────────


def load_leads() -> list[dict]:
    with open(LEADS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_leads(leads: list[dict]) -> None:
    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)


def load_report() -> dict:
    if REPORT_FILE.exists():
        with open(REPORT_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "runs": [],
        "totals": {
            "leads_total": 0,
            "leads_enriched": 0,
            "by_source": {},
            "by_confidence": {},
            "by_niche": {},
        },
    }


def save_report(report: dict) -> None:
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)


def rebuild_report_totals(report: dict, leads: list[dict]) -> None:
    """Recalculate aggregated totals from current leads state."""
    by_source: dict[str, int] = {}
    by_confidence: dict[str, int] = {}
    by_niche: dict[str, int] = {}
    enriched = 0

    for lead in leads:
        email = lead.get("email", "")
        if email:
            enriched += 1
            src = lead.get("email_source", "unknown")
            conf = lead.get("email_confidence", "unknown")
            niche = lead.get("niche", "unknown")
            by_source[src] = by_source.get(src, 0) + 1
            by_confidence[conf] = by_confidence.get(conf, 0) + 1
            by_niche[niche] = by_niche.get(niche, 0) + 1

    report["totals"] = {
        "leads_total": len(leads),
        "leads_enriched": enriched,
        "coverage_pct": round(enriched / len(leads) * 100, 1) if leads else 0,
        "by_source": by_source,
        "by_confidence": by_confidence,
        "by_niche": by_niche,
    }
    report["updated_at"] = datetime.now(timezone.utc).isoformat()


def print_report(report: dict) -> None:
    """Pretty-print the enrichment report to stdout."""
    totals = report.get("totals", {})
    print("\n── Enrichment Report ─────────────────────────────────────────")
    print(f"  Last updated  : {report.get('updated_at', 'n/a')}")
    print(f"  Total leads   : {totals.get('leads_total', 0)}")
    print(f"  Enriched      : {totals.get('leads_enriched', 0)}")
    print(f"  Coverage      : {totals.get('coverage_pct', 0)}%")

    by_source = totals.get("by_source", {})
    if by_source:
        print("\n  By source:")
        for src, count in sorted(by_source.items(), key=lambda x: -x[1]):
            print(f"    {src:<25} {count}")

    by_conf = totals.get("by_confidence", {})
    if by_conf:
        print("\n  By confidence:")
        for conf, count in sorted(by_conf.items(), key=lambda x: -x[1]):
            print(f"    {conf:<25} {count}")

    by_niche = totals.get("by_niche", {})
    if by_niche:
        print("\n  By niche:")
        for niche, count in sorted(by_niche.items(), key=lambda x: -x[1]):
            print(f"    {niche:<25} {count}")

    runs = report.get("runs", [])
    if runs:
        print(f"\n  Total runs    : {len(runs)}")
        last = runs[-1]
        print(f"  Last run      : {last.get('started_at', 'n/a')}")
        print(f"    processed   : {last.get('leads_processed', 0)}")
        print(f"    enriched    : {last.get('leads_enriched', 0)}")
        print(f"    skipped     : {last.get('leads_skipped', 0)}")
    print("──────────────────────────────────────────────────────────────\n")


# ── Main ──────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich local business leads with email addresses."
    )
    parser.add_argument("--hunter-key", metavar="KEY", help="Hunter.io API key")
    parser.add_argument(
        "--max", type=int, metavar="N", help="Maximum number of leads to enrich"
    )
    parser.add_argument("--niche", metavar="NICHE", help="Filter leads by niche")
    parser.add_argument(
        "--pattern-only",
        action="store_true",
        help="Skip API calls, use pattern guessing only",
    )
    parser.add_argument(
        "--verify-smtp",
        action="store_true",
        help="Attempt SMTP mailbox verification for guessed emails",
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Print current enrichment report and exit",
    )
    args = parser.parse_args()

    # ── Show report only ──────────────────────────────────────────────────────
    if args.report:
        report = load_report()
        if report.get("updated_at") is None:
            print("No enrichment data yet. Run without --report to start enriching.")
        else:
            print_report(report)
        return

    # ── Load data ─────────────────────────────────────────────────────────────
    leads = load_leads()
    report = load_report()

    # ── Filter candidates ─────────────────────────────────────────────────────
    candidates = [
        (i, lead)
        for i, lead in enumerate(leads)
        if not lead.get("email")  # skip already-enriched
    ]

    if args.niche:
        niche_filter = args.niche.lower()
        candidates = [
            (i, lead)
            for i, lead in candidates
            if lead.get("niche", "").lower() == niche_filter
        ]

    if args.max:
        candidates = candidates[: args.max]

    if not candidates:
        print("No leads to enrich (all have emails already, or filter matched none).")
        return

    print(f"Found {len(candidates)} leads to enrich.")
    if args.hunter_key:
        print("Hunter.io API key provided — will attempt domain search first.")
    if args.pattern_only:
        print("Pattern-only mode — skipping Hunter.io.")
    if args.verify_smtp:
        print("SMTP verification enabled.")
    print()

    # ── Run enrichment ────────────────────────────────────────────────────────
    run_stats = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "leads_processed": 0,
        "leads_enriched": 0,
        "leads_skipped": 0,
        "args": {
            "max": args.max,
            "niche": args.niche,
            "pattern_only": args.pattern_only,
            "verify_smtp": args.verify_smtp,
            "hunter_key_provided": bool(args.hunter_key),
        },
    }

    hunter_key = args.hunter_key
    hunter_disabled = False

    for idx, (lead_index, lead) in enumerate(candidates):
        run_stats["leads_processed"] += 1

        # Disable Hunter if previous call returned _disable
        if hunter_disabled:
            hunter_key = None

        enrichment = enrich_lead(
            lead,
            hunter_key=hunter_key if not args.pattern_only else None,
            pattern_only=args.pattern_only,
            verify_smtp=args.verify_smtp,
        )

        # Check if Hunter was disabled mid-run
        if enrichment.get("_disable"):
            hunter_disabled = True
            # retry this lead without Hunter
            enrichment = enrich_lead(
                lead,
                hunter_key=None,
                pattern_only=True,
                verify_smtp=args.verify_smtp,
            )

        if enrichment and enrichment.get("email"):
            # Merge enrichment fields into lead (never overwrite unrelated fields)
            leads[lead_index]["email"] = enrichment["email"]
            leads[lead_index]["email_source"] = enrichment.get(
                "email_source", "unknown"
            )
            leads[lead_index]["email_confidence"] = enrichment.get(
                "email_confidence", "unknown"
            )
            if enrichment.get("email_domain"):
                leads[lead_index]["email_domain"] = enrichment["email_domain"]
            run_stats["leads_enriched"] += 1
        else:
            run_stats["leads_skipped"] += 1
            print(f"  ✗ No email found for: {lead['name']}")

        # Progressive save after every lead (crash-safe)
        save_leads(leads)

        print()

    # ── Finalize report ───────────────────────────────────────────────────────
    run_stats["finished_at"] = datetime.now(timezone.utc).isoformat()
    report.setdefault("runs", []).append(run_stats)
    rebuild_report_totals(report, leads)
    save_report(report)

    print_report(report)
    print(f"leads.json saved → {LEADS_FILE}")
    print(f"enrichment-report.json saved → {REPORT_FILE}")


if __name__ == "__main__":
    main()
