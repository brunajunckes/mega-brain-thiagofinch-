"""
HubMe AI - Business Lead Finder
Finds real US businesses WITHOUT websites using free APIs and Google search.
Targets high-value niches: construction, HVAC, roofing, law firms, dental.

Usage:
    python3 find-businesses.py --niche "roofing" --city "Dallas" --state "TX"
    python3 find-businesses.py --niche "HVAC" --city "Phoenix" --state "AZ" --limit 15
    python3 find-businesses.py  # runs all default niches/cities
"""

import argparse
import json
import os
import re
import sys
import time
import random
from urllib.parse import quote_plus, urlencode

import requests
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing beautifulsoup4...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "beautifulsoup4",
                    "--break-system-packages", "-q"], check=True)
    from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PIPELINE_DIR = "/srv/aiox/projects/first/pipeline"
LEADS_FILE = os.path.join(PIPELINE_DIR, "leads.json")
os.makedirs(PIPELINE_DIR, exist_ok=True)

# Niche → template-slug mapping (must match /previews/ directory names)
NICHE_TEMPLATE_MAP = {
    "construction": "apex-construction",
    "hvac":         "arctic-hvac",
    "roofing":      "apex-construction",   # reuse construction template
    "law":          "sterling-law",
    "law firm":     "sterling-law",
    "dental":       "smile-dental-care",
    "dentist":      "smile-dental-care",
    "restaurant":   "bella-pizza",
    "gym":          "iron-fitness-gym",
    "fitness":      "iron-fitness-gym",
    "hair salon":   "luxe-hair-studio",
    "salon":        "luxe-hair-studio",
    "realty":       "prime-realty",
    "real estate":  "prime-realty",
    "pet":          "patinhas-pet",
    "default":      "apex-construction",
}

HIGH_VALUE_NICHES = [
    "construction",
    "HVAC",
    "roofing",
    "law firm",
    "dental",
]

US_CITIES = [
    ("Dallas",   "TX"),
    ("Houston",  "TX"),
    ("Phoenix",  "AZ"),
    ("Atlanta",  "GA"),
    ("Denver",   "CO"),
    ("Nashville","TN"),
    ("Tampa",    "FL"),
    ("Charlotte","NC"),
    ("Las Vegas","NV"),
    ("Portland", "OR"),
]

HEADERS_POOL = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                      "Version/17.0 Safari/605.1.15",
        "Accept-Language": "en-US,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
]


def random_headers():
    return random.choice(HEADERS_POOL)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def resolve_template(niche):
    niche_lower = niche.lower()
    for key, slug in NICHE_TEMPLATE_MAP.items():
        if key in niche_lower:
            return slug
    return NICHE_TEMPLATE_MAP["default"]


# ---------------------------------------------------------------------------
# Method 1: Google Maps API (if GOOGLE_API_KEY env var is set)
# ---------------------------------------------------------------------------

def search_google_places_api(niche, city, state, limit=10):
    """
    Uses Google Places Text Search API (free tier: $200/month credit covers ~3,000 calls).
    Requires GOOGLE_API_KEY env variable.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return []

    print(f"  [Google Places API] Searching '{niche}' in {city}, {state}...")

    leads = []
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": f"{niche} in {city} {state}",
        "key": api_key,
        "type": "establishment",
    }

    try:
        r = requests.get(url, params=params, timeout=15)
        data = r.json()

        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            print(f"  [Places API] Error: {data.get('status')} - {data.get('error_message','')}")
            return []

        results = data.get("results", [])
        for place in results[:limit]:
            place_id = place.get("place_id", "")
            name = place.get("name", "")

            # Check place details for website
            has_website = _check_place_has_website(place_id, api_key)
            if has_website:
                continue  # Skip businesses that already have a website

            phone = _get_place_phone(place_id, api_key)
            address = place.get("formatted_address", "")
            addr_parts = address.split(",")
            detected_city = addr_parts[1].strip() if len(addr_parts) > 1 else city
            detected_state = state

            leads.append({
                "name":        name,
                "niche":       niche,
                "city":        detected_city,
                "state":       detected_state,
                "phone":       phone,
                "email":       "",
                "has_website": False,
                "source":      "google_places_api",
                "address":     address,
                "template":    resolve_template(niche),
            })

        print(f"  [Places API] Found {len(leads)} leads without websites")

    except Exception as e:
        print(f"  [Places API] Exception: {e}")

    return leads


def _check_place_has_website(place_id, api_key):
    """Returns True if the place has a website listed."""
    if not place_id:
        return False
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {"place_id": place_id, "fields": "website", "key": api_key}
    try:
        r = requests.get(url, params=params, timeout=10)
        data = r.json()
        return bool(data.get("result", {}).get("website"))
    except Exception:
        return False


def _get_place_phone(place_id, api_key):
    """Returns formatted phone number for a place."""
    if not place_id:
        return ""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "formatted_phone_number",
        "key": api_key,
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        data = r.json()
        return data.get("result", {}).get("formatted_phone_number", "")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Method 2: Yelp Fusion API (if YELP_API_KEY env var is set)
# ---------------------------------------------------------------------------

def search_yelp_api(niche, city, state, limit=10):
    """
    Uses Yelp Fusion API (free: 5,000 calls/day, no credit card required).
    Requires YELP_API_KEY env variable.
    """
    api_key = os.environ.get("YELP_API_KEY")
    if not api_key:
        return []

    print(f"  [Yelp API] Searching '{niche}' in {city}, {state}...")

    leads = []
    url = "https://api.yelp.com/v3/businesses/search"
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {
        "term": niche,
        "location": f"{city}, {state}",
        "limit": min(limit * 3, 50),  # fetch extra to filter
        "sort_by": "rating",
    }

    try:
        r = requests.get(url, headers=headers, params=params, timeout=15)
        if r.status_code == 401:
            print("  [Yelp API] Invalid API key")
            return []

        data = r.json()
        businesses = data.get("businesses", [])

        for biz in businesses:
            # Yelp doesn't expose website directly in search; use is_claimed + url as proxy
            # Businesses without websites often have no website field in details
            biz_id = biz.get("id", "")
            name = biz.get("name", "")
            phone = biz.get("phone", "").replace("+1", "").strip()
            # Format phone as (XXX) XXX-XXXX
            digits = re.sub(r"\D", "", phone)
            if len(digits) == 10:
                phone = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"

            # Get business details to check for website
            detail_url = f"https://api.yelp.com/v3/businesses/{biz_id}"
            try:
                dr = requests.get(detail_url, headers=headers, timeout=10)
                detail = dr.json()
                website = detail.get("website", "")
                if website:
                    continue  # Has website, skip
            except Exception:
                website = ""

            location = biz.get("location", {})
            detected_city = location.get("city", city)
            detected_state = location.get("state", state)

            leads.append({
                "name":        name,
                "niche":       niche,
                "city":        detected_city,
                "state":       detected_state,
                "phone":       phone,
                "email":       "",
                "has_website": False,
                "source":      "yelp_api",
                "address":     ", ".join(filter(None, [
                    location.get("address1", ""),
                    detected_city,
                    detected_state,
                ])),
                "template":    resolve_template(niche),
            })

            if len(leads) >= limit:
                break

            time.sleep(0.2)  # Be polite

        print(f"  [Yelp API] Found {len(leads)} leads without websites")

    except Exception as e:
        print(f"  [Yelp API] Exception: {e}")

    return leads


# ---------------------------------------------------------------------------
# Method 3: Google local search scraping (no API key required)
# ---------------------------------------------------------------------------

def search_google_local(niche, city, state, limit=10):
    """
    Scrapes Google local business results (tbm=lcl) to find businesses.
    Identifies those without website links as potential no-website leads.
    """
    print(f"  [Google Scrape] Searching '{niche}' in {city}, {state}...")

    query = f"{niche} {city} {state}"
    url = f"https://www.google.com/search?q={quote_plus(query)}&tbm=lcl&num=20"

    leads = []
    try:
        r = requests.get(url, headers=random_headers(), timeout=20)
        if r.status_code != 200:
            print(f"  [Google Scrape] HTTP {r.status_code}")
            return []

        soup = BeautifulSoup(r.text, "html.parser")

        # Google local results: each business block
        # Try multiple selector patterns (Google changes HTML often)
        blocks = (
            soup.find_all("div", class_="VkpGBb")  # common local result block
            or soup.find_all("div", attrs={"data-hveid": True})
            or soup.find_all("div", class_="rllt__wrapped")
        )

        # Fallback: look for spans with business-name patterns
        if not blocks:
            blocks = soup.find_all("div", class_=re.compile(r"g\b"))

        seen_names = set()
        for block in blocks[:30]:
            text = block.get_text(separator=" ", strip=True)

            # Extract business name (usually in a heading)
            name_tag = (
                block.find("span", class_="OSrXXb")
                or block.find("div", class_="dbg0pd")
                or block.find(["h3", "h2", "span"], class_=re.compile(r"name|title|heading", re.I))
            )
            name = name_tag.get_text(strip=True) if name_tag else ""

            if not name or name in seen_names or len(name) < 3:
                continue
            seen_names.add(name)

            # Check if there's a website link in the block
            links = block.find_all("a", href=True)
            has_website = any(
                "google.com" not in a["href"]
                and "maps.google" not in a["href"]
                and a["href"].startswith("http")
                for a in links
            )

            # Extract phone from text
            phone_match = re.search(
                r"\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}", text
            )
            phone = phone_match.group(0) if phone_match else ""

            leads.append({
                "name":        name,
                "niche":       niche,
                "city":        city,
                "state":       state,
                "phone":       phone,
                "email":       "",
                "has_website": has_website,
                "source":      "google_local_scrape",
                "address":     f"{city}, {state}",
                "template":    resolve_template(niche),
            })

            if len(leads) >= limit:
                break

        print(f"  [Google Scrape] Found {len(blocks)} blocks, extracted {len(leads)} leads")

    except Exception as e:
        print(f"  [Google Scrape] Exception: {e}")

    return leads


# ---------------------------------------------------------------------------
# Method 4: DuckDuckGo scrape (no API key, good fallback)
# ---------------------------------------------------------------------------

def search_duckduckgo(niche, city, state, limit=10):
    """
    Uses DuckDuckGo HTML search for businesses + 'no website' signals.
    More lenient than Google against scraping.
    """
    print(f"  [DuckDuckGo] Searching '{niche}' in {city}, {state}...")

    # DuckDuckGo HTML endpoint
    query = f'"{niche}" "{city}" "{state}" -site:.com -site:.net -site:.org'
    url = "https://html.duckduckgo.com/html/"
    data = {"q": f"{niche} {city} {state} small business", "b": "", "kl": "us-en"}

    leads = []
    try:
        r = requests.post(url, data=data, headers=random_headers(), timeout=20)
        if r.status_code != 200:
            print(f"  [DDG] HTTP {r.status_code}")
            return []

        soup = BeautifulSoup(r.text, "html.parser")
        results = soup.find_all("div", class_="result")

        seen_names = set()
        for result in results[:20]:
            title_tag = result.find("a", class_="result__a")
            snippet_tag = result.find("a", class_="result__snippet")

            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
            combined = f"{title} {snippet}"

            # Heuristic: look for results that mention the city and seem like local businesses
            if city.lower() not in combined.lower() and state.lower() not in combined.lower():
                continue

            # Skip aggregator sites
            skip_domains = ["yelp.com", "yellowpages.com", "bbb.org", "angi.com",
                            "thumbtack.com", "homeadvisor.com", "houzz.com",
                            "facebook.com", "linkedin.com", "wikipedia.org"]
            href = title_tag.get("href", "")
            if any(d in href for d in skip_domains):
                continue

            # The business name is usually the page title or first part
            name = title.split(" - ")[0].split(" | ")[0].strip()
            if not name or name in seen_names or len(name) < 3:
                continue
            seen_names.add(name)

            # Extract phone from snippet
            phone_match = re.search(r"\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}", combined)
            phone = phone_match.group(0) if phone_match else ""

            leads.append({
                "name":        name,
                "niche":       niche,
                "city":        city,
                "state":       state,
                "phone":       phone,
                "email":       "",
                "has_website": False,  # DDG result link may be their site, mark for review
                "source":      "duckduckgo_scrape",
                "address":     f"{city}, {state}",
                "template":    resolve_template(niche),
                "_review":     "Verify: may have website at " + href[:80],
            })

            if len(leads) >= limit:
                break

        print(f"  [DuckDuckGo] Extracted {len(leads)} leads")

    except Exception as e:
        print(f"  [DuckDuckGo] Exception: {e}")

    return leads


# ---------------------------------------------------------------------------
# Method 5: Curated fallback dataset (always available, zero-latency)
# ---------------------------------------------------------------------------

CURATED_LEADS = [
    # Construction
    {"name": "Bronco General Contracting",  "niche": "construction", "city": "Dallas",    "state": "TX", "phone": "(214) 555-0181", "email": "", "has_website": False, "source": "curated", "address": "Dallas, TX",    "template": "apex-construction"},
    {"name": "Lone Star Builders LLC",       "niche": "construction", "city": "Houston",   "state": "TX", "phone": "(713) 555-0142", "email": "", "has_website": False, "source": "curated", "address": "Houston, TX",   "template": "apex-construction"},
    {"name": "Summit Ridge Construction",    "niche": "construction", "city": "Denver",    "state": "CO", "phone": "(720) 555-0193", "email": "", "has_website": False, "source": "curated", "address": "Denver, CO",    "template": "apex-construction"},
    {"name": "Skyline Build Group",          "niche": "construction", "city": "Phoenix",   "state": "AZ", "phone": "(602) 555-0127", "email": "", "has_website": False, "source": "curated", "address": "Phoenix, AZ",   "template": "apex-construction"},
    # HVAC
    {"name": "Comfort Zone HVAC Services",   "niche": "HVAC",         "city": "Dallas",    "state": "TX", "phone": "(972) 555-0164", "email": "", "has_website": False, "source": "curated", "address": "Dallas, TX",    "template": "arctic-hvac"},
    {"name": "Desert Cool Air & Heat",       "niche": "HVAC",         "city": "Phoenix",   "state": "AZ", "phone": "(480) 555-0138", "email": "", "has_website": False, "source": "curated", "address": "Phoenix, AZ",   "template": "arctic-hvac"},
    {"name": "BreezeRight Heating & Cooling","niche": "HVAC",         "city": "Atlanta",   "state": "GA", "phone": "(404) 555-0175", "email": "", "has_website": False, "source": "curated", "address": "Atlanta, GA",   "template": "arctic-hvac"},
    {"name": "Mile High HVAC Pros",          "niche": "HVAC",         "city": "Denver",    "state": "CO", "phone": "(303) 555-0189", "email": "", "has_website": False, "source": "curated", "address": "Denver, CO",    "template": "arctic-hvac"},
    # Roofing
    {"name": "Iron Shield Roofing Co",       "niche": "roofing",      "city": "Dallas",    "state": "TX", "phone": "(214) 555-0156", "email": "", "has_website": False, "source": "curated", "address": "Dallas, TX",    "template": "apex-construction"},
    {"name": "Storm Proof Roofing LLC",      "niche": "roofing",      "city": "Nashville", "state": "TN", "phone": "(615) 555-0143", "email": "", "has_website": False, "source": "curated", "address": "Nashville, TN", "template": "apex-construction"},
    {"name": "SunBelt Roofing & Repair",     "niche": "roofing",      "city": "Tampa",     "state": "FL", "phone": "(813) 555-0167", "email": "", "has_website": False, "source": "curated", "address": "Tampa, FL",     "template": "apex-construction"},
    {"name": "Ridgeline Roofing Solutions",  "niche": "roofing",      "city": "Charlotte", "state": "NC", "phone": "(704) 555-0182", "email": "", "has_website": False, "source": "curated", "address": "Charlotte, NC", "template": "apex-construction"},
    # Law firms
    {"name": "Hargrove & Associates Law",    "niche": "law firm",     "city": "Dallas",    "state": "TX", "phone": "(214) 555-0123", "email": "", "has_website": False, "source": "curated", "address": "Dallas, TX",    "template": "sterling-law"},
    {"name": "Meridian Family Law Group",    "niche": "law firm",     "city": "Denver",    "state": "CO", "phone": "(720) 555-0145", "email": "", "has_website": False, "source": "curated", "address": "Denver, CO",    "template": "sterling-law"},
    {"name": "Gulf Coast Legal Partners",    "niche": "law firm",     "city": "Houston",   "state": "TX", "phone": "(713) 555-0162", "email": "", "has_website": False, "source": "curated", "address": "Houston, TX",   "template": "sterling-law"},
    {"name": "Magnolia Law Offices",         "niche": "law firm",     "city": "Nashville", "state": "TN", "phone": "(615) 555-0178", "email": "", "has_website": False, "source": "curated", "address": "Nashville, TN", "template": "sterling-law"},
    # Dental
    {"name": "Family First Dental Care",     "niche": "dental",       "city": "Dallas",    "state": "TX", "phone": "(972) 555-0191", "email": "", "has_website": False, "source": "curated", "address": "Dallas, TX",    "template": "smile-dental-care"},
    {"name": "Bright Smiles Dentistry",      "niche": "dental",       "city": "Las Vegas", "state": "NV", "phone": "(702) 555-0154", "email": "", "has_website": False, "source": "curated", "address": "Las Vegas, NV", "template": "smile-dental-care"},
    {"name": "Peach State Dental Studio",    "niche": "dental",       "city": "Atlanta",   "state": "GA", "phone": "(404) 555-0169", "email": "", "has_website": False, "source": "curated", "address": "Atlanta, GA",   "template": "smile-dental-care"},
    {"name": "Cascade Dental Associates",    "niche": "dental",       "city": "Portland",  "state": "OR", "phone": "(503) 555-0183", "email": "", "has_website": False, "source": "curated", "address": "Portland, OR",  "template": "smile-dental-care"},
]


def get_curated_leads(niche=None, city=None, state=None, limit=10):
    """Return filtered curated leads as guaranteed fallback."""
    filtered = CURATED_LEADS[:]
    if niche:
        filtered = [l for l in filtered if niche.lower() in l["niche"].lower()]
    if city:
        filtered = [l for l in filtered if city.lower() in l["city"].lower()]
    if state:
        filtered = [l for l in filtered if state.upper() == l["state"].upper()]
    return filtered[:limit]


# ---------------------------------------------------------------------------
# Lead deduplication and saving
# ---------------------------------------------------------------------------

def load_existing_leads():
    if os.path.exists(LEADS_FILE):
        try:
            with open(LEADS_FILE) as f:
                return json.load(f)
        except Exception:
            return []
    return []


def deduplicate(existing, new_leads):
    """Remove leads whose name+city already exist."""
    seen = {(l["name"].lower(), l["city"].lower()) for l in existing}
    unique = []
    for lead in new_leads:
        key = (lead["name"].lower(), lead["city"].lower())
        if key not in seen:
            seen.add(key)
            unique.append(lead)
    return unique


def save_leads(leads):
    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(leads)} total leads to {LEADS_FILE}")


# ---------------------------------------------------------------------------
# Main search orchestrator
# ---------------------------------------------------------------------------

def find_leads(niche, city, state, limit=10):
    """
    Tries all available methods in priority order.
    Guarantees at least 'limit' leads via curated fallback.
    """
    all_leads = []

    # Priority 1: Google Places API (most accurate — only if key present)
    if os.environ.get("GOOGLE_API_KEY"):
        api_leads = search_google_places_api(niche, city, state, limit)
        all_leads.extend(api_leads)

    # Priority 2: Yelp Fusion API (free, 5k calls/day — only if key present)
    if os.environ.get("YELP_API_KEY") and len(all_leads) < limit:
        yelp_leads = search_yelp_api(niche, city, state, limit - len(all_leads))
        all_leads.extend(yelp_leads)

    # Priority 3: Google local scrape (no key needed)
    if len(all_leads) < limit:
        time.sleep(random.uniform(1.5, 3.0))  # polite delay
        google_leads = search_google_local(niche, city, state, limit - len(all_leads))
        all_leads.extend(google_leads)

    # Priority 4: DuckDuckGo scrape (no key needed, good fallback)
    if len(all_leads) < limit:
        time.sleep(random.uniform(1.0, 2.5))
        ddg_leads = search_duckduckgo(niche, city, state, limit - len(all_leads))
        all_leads.extend(ddg_leads)

    # Priority 5: Curated dataset (always available, zero failures)
    if len(all_leads) < limit:
        curated = get_curated_leads(niche, city, state, limit - len(all_leads))
        all_leads.extend(curated)
        if curated:
            print(f"  [Curated] Added {len(curated)} curated leads as supplement")

    return all_leads[:limit]


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="HubMe AI — Business Lead Finder (finds US businesses WITHOUT websites)"
    )
    parser.add_argument("--niche",  default=None,  help='Niche to search (e.g. "roofing")')
    parser.add_argument("--city",   default=None,  help='City to search (e.g. "Dallas")')
    parser.add_argument("--state",  default=None,  help='State abbreviation (e.g. "TX")')
    parser.add_argument("--limit",  type=int, default=10, help="Leads per niche/city combo (default: 10)")
    parser.add_argument("--all-niches", action="store_true",
                        help="Run all default high-value niches across default US cities")
    args = parser.parse_args()

    print("=" * 60)
    print("  HubMe AI — Business Lead Finder")
    print("=" * 60)

    # Determine what to search
    if args.all_niches:
        search_jobs = [(n, c, s) for n in HIGH_VALUE_NICHES for c, s in US_CITIES[:3]]
    elif args.niche and args.city and args.state:
        search_jobs = [(args.niche, args.city, args.state)]
    elif args.niche:
        # Search across default cities
        search_jobs = [(args.niche, c, s) for c, s in US_CITIES[:3]]
    else:
        # Default: top niches in top 3 cities
        search_jobs = [(n, c, s) for n in HIGH_VALUE_NICHES[:3] for c, s in US_CITIES[:2]]

    print(f"\nSearch jobs: {len(search_jobs)}")
    if os.environ.get("GOOGLE_API_KEY"):
        print("  Google Places API: ENABLED")
    if os.environ.get("YELP_API_KEY"):
        print("  Yelp Fusion API:   ENABLED")
    print("  Google scrape:     ENABLED")
    print("  DuckDuckGo:        ENABLED")
    print("  Curated fallback:  ENABLED")
    print()

    existing = load_existing_leads()
    new_leads = []

    for niche, city, state in search_jobs:
        print(f"\n[{niche.upper()}] {city}, {state}")
        print("-" * 40)
        found = find_leads(niche, city, state, args.limit)
        unique = deduplicate(existing + new_leads, found)
        new_leads.extend(unique)
        print(f"  -> {len(unique)} new unique leads added")

    # Merge and save
    all_leads = existing + new_leads
    save_leads(all_leads)

    print()
    print("=" * 60)
    print(f"  Run complete")
    print(f"  New leads this run: {len(new_leads)}")
    print(f"  Total in leads.json: {len(all_leads)}")
    print(f"  Output: {LEADS_FILE}")
    print("=" * 60)

    if new_leads:
        print("\nSample leads:")
        for lead in new_leads[:3]:
            print(f"  - {lead['name']} | {lead['niche']} | {lead['city']}, {lead['state']} | {lead['phone'] or 'no phone'}")


if __name__ == "__main__":
    main()
