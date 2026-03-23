"""
HubMe AI - Preview Generator
Takes a lead from leads.json, copies the matching niche template from
/srv/aiox/projects/first/previews/{template-slug}/index.html, personalizes it
with the business name, phone, and city, then saves it to
/srv/aiox/projects/first/previews/{business-slug}/index.html.

Prints the live preview URL: https://preview.hubme.tech/{business-slug}

Usage:
    python3 generate-preview.py                          # process first unprocessed lead
    python3 generate-preview.py --index 3               # use leads.json[3]
    python3 generate-preview.py --name "Iron Shield"    # search by name substring
    python3 generate-preview.py --all                   # generate previews for all leads
    python3 generate-preview.py --list                  # list all leads in leads.json
"""

import argparse
import json
import os
import re
import shutil
import sys
import urllib.request
import urllib.parse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PIPELINE_DIR  = "/srv/aiox/projects/first/pipeline"
PREVIEWS_DIR  = "/srv/aiox/projects/first/previews"
LEADS_FILE    = os.path.join(PIPELINE_DIR, "leads.json")
PREVIEW_BASE  = "https://preview.hubme.tech"

# Niche → template slug (must match directories inside PREVIEWS_DIR)
NICHE_TEMPLATE_MAP = {
    "construction": "apex-construction",
    "hvac":         "arctic-hvac",
    "roofing":      "summit-roofing",
    "law":          "justice-law-group",
    "law firm":     "justice-law-group",
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

# Existing template business names — used for find/replace in HTML
TEMPLATE_BUSINESS_NAMES = {
    "apex-construction": "Apex Construction Group",
    "arctic-hvac":       "Arctic Air HVAC",
    "bella-pizza":       "Bella Pizza",
    "iron-fitness-gym":  "Iron Fitness Gym",
    "luxe-hair-studio":  "Luxe Hair Studio",
    "patinhas-pet":      "Patinhas Pet",
    "power-gym":         "Power Gym",
    "prime-realty":      "Prime Realty",
    "smile-dental-care": "Smile Dental Care",
    "sterling-law":      "Sterling Law",
    "summit-roofing":    "Summit Roofing & Restoration",
    "justice-law-group": "Justice Law Group",
}

# Placeholder phone numbers used in each template (to be replaced)
TEMPLATE_PHONES = {
    "apex-construction": "(800) 555-1234",
    "arctic-hvac":       "(555) 847-2945",
    "bella-pizza":       "(305) 555-0123",
    "iron-fitness-gym":  "(503) 555-0321",
    "luxe-hair-studio":  "(720) 555-0789",
    "patinhas-pet":      "(555) 000-0000",
    "power-gym":         "(555) 000-0000",
    "prime-realty":      "(555) 000-0000",
    "smile-dental-care": "(512) 555-0456",
    "sterling-law":      "(555) 000-0000",
    "summit-roofing":    "(800) 555-7890",
    "justice-law-group": "(800) 555-2580",
}

# Placeholder cities in each template
TEMPLATE_CITIES = {
    "apex-construction": "Dallas",
    "arctic-hvac":       "Denver",
    "bella-pizza":       "Miami",
    "iron-fitness-gym":  "Portland",
    "luxe-hair-studio":  "Denver",
    "patinhas-pet":      "Miami",
    "power-gym":         "Miami",
    "prime-realty":      "Miami",
    "smile-dental-care": "Austin",
    "sterling-law":      "New York",
    "summit-roofing":    "Denver",
    "justice-law-group": "Houston",
}


# ---------------------------------------------------------------------------
# Photo / Image helpers
# ---------------------------------------------------------------------------

# Curated Unsplash fallback photos keyed by niche
FALLBACK_PHOTOS = {
    'construction': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
    'hvac':         'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80',
    'roofing':      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    'law':          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80',
    'dental':       'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1920&q=80',
    'restaurant':   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    'gym':          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    'salon':        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
    'realty':       'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    'default':      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
}

# Map niche keywords to FALLBACK_PHOTOS keys
NICHE_PHOTO_KEY = {
    'construction': 'construction',
    'roofing':      'construction',
    'hvac':         'hvac',
    'law':          'law',
    'law firm':     'law',
    'dental':       'dental',
    'dentist':      'dental',
    'restaurant':   'restaurant',
    'gym':          'gym',
    'fitness':      'gym',
    'hair salon':   'salon',
    'salon':        'salon',
    'realty':       'realty',
    'real estate':  'realty',
}


def fetch_pexels_photo(query, orientation='landscape'):
    """
    Try to fetch a photo URL from the Pexels API.

    Returns:
        str: photo URL (large2x) if API key exists and call succeeds.
        str: curated Unsplash fallback URL otherwise.
    """
    api_key = os.getenv('PEXELS_API_KEY', '')
    if api_key:
        try:
            encoded_query = urllib.parse.quote(query)
            url = (
                f'https://api.pexels.com/v1/search'
                f'?query={encoded_query}&per_page=1&orientation={orientation}'
            )
            req = urllib.request.Request(url, headers={'Authorization': api_key})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                photos = data.get('photos', [])
                if photos:
                    photo_url = photos[0]['src']['large2x']
                    print(f"  [photo] Pexels: {photo_url[:72]}...")
                    return photo_url
        except Exception as exc:
            print(f"  [photo] Pexels API failed ({exc}), using Unsplash fallback.")

    # Determine best fallback key from query
    query_lower = query.lower()
    fallback_key = 'default'
    for key in NICHE_PHOTO_KEY:
        if key in query_lower:
            fallback_key = NICHE_PHOTO_KEY[key]
            break
    photo_url = FALLBACK_PHOTOS.get(fallback_key, FALLBACK_PHOTOS['default'])
    print(f"  [photo] Unsplash fallback ({fallback_key}): {photo_url[:72]}")
    return photo_url


def get_google_places_photo(business_name, city):
    """
    Try to fetch a Google Places photo URL for the given business.

    Returns:
        str: photo URL if GOOGLE_API_KEY is set and the search succeeds.
        None: if no API key or the search fails.
    """
    api_key = os.getenv('GOOGLE_API_KEY', '')
    if not api_key:
        return None

    try:
        query = urllib.parse.quote(f'{business_name} {city}')
        search_url = (
            f'https://maps.googleapis.com/maps/api/place/textsearch/json'
            f'?query={query}&key={api_key}'
        )
        req = urllib.request.Request(search_url)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            results = data.get('results', [])
            if not results:
                return None

            place = results[0]
            photos = place.get('photos', [])
            if not photos:
                return None

            photo_ref = photos[0]['photo_reference']
            photo_url = (
                f'https://maps.googleapis.com/maps/api/place/photo'
                f'?maxwidth=1920&photoreference={photo_ref}&key={api_key}'
            )
            print(f"  [photo] Google Places: found photo for '{business_name}'")
            return photo_url
    except Exception as exc:
        print(f"  [photo] Google Places failed ({exc})")
        return None


def inject_hero_photo(html, photo_url):
    """
    Inject a real background photo into the hero section of the HTML.

    Looks for <div class="hero" or <section class="hero" elements that have
    a linear-gradient background and replaces/extends it with the photo as
    a layered background-image with an overlay.

    Returns:
        tuple[str, bool]: (modified_html, was_injected)
    """
    overlay = (
        f'linear-gradient(rgba(12,24,41,0.75), rgba(12,24,41,0.85)), '
        f"url('{photo_url}') center/cover no-repeat"
    )

    # Pattern: background: linear-gradient(...) inside a style="..." on the hero element
    # We look for existing background: linear-gradient in inline style on hero
    inline_pattern = re.compile(
        r'((?:class|id)=["\'][^"\']*hero[^"\']*["\'][^>]*style=["\'][^"\']*)'
        r'(background\s*:\s*linear-gradient[^;]+;?)',
        re.IGNORECASE | re.DOTALL
    )
    match = inline_pattern.search(html)
    if match:
        new_html = inline_pattern.sub(
            lambda m: m.group(1) + f'background: {overlay};',
            html,
            count=1
        )
        return new_html, True

    # Pattern: .hero { ... background: linear-gradient(...) ... } in <style> block
    css_pattern = re.compile(
        r'(\.hero\s*\{[^}]*?)(background\s*:[^;]+linear-gradient[^;]*;)',
        re.IGNORECASE | re.DOTALL
    )
    match = css_pattern.search(html)
    if match:
        new_html = css_pattern.sub(
            lambda m: m.group(1) + f'background: {overlay};',
            html,
            count=1
        )
        return new_html, True

    return html, False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def resolve_template(niche, explicit_template=None):
    """Return the best matching template slug for a niche."""
    if explicit_template and os.path.isdir(os.path.join(PREVIEWS_DIR, explicit_template)):
        return explicit_template

    niche_lower = niche.lower()
    for key, slug in NICHE_TEMPLATE_MAP.items():
        if key in niche_lower:
            template_path = os.path.join(PREVIEWS_DIR, slug)
            if os.path.isdir(template_path):
                return slug

    # Fall back to first available template
    fallback = NICHE_TEMPLATE_MAP["default"]
    if os.path.isdir(os.path.join(PREVIEWS_DIR, fallback)):
        return fallback

    # Last resort: use any available directory
    dirs = [d for d in os.listdir(PREVIEWS_DIR)
            if os.path.isdir(os.path.join(PREVIEWS_DIR, d))]
    return dirs[0] if dirs else None


def load_leads():
    if not os.path.exists(LEADS_FILE):
        print(f"ERROR: {LEADS_FILE} not found. Run find-businesses.py first.")
        sys.exit(1)
    with open(LEADS_FILE) as f:
        leads = json.load(f)
    if not leads:
        print("ERROR: leads.json is empty. Run find-businesses.py first.")
        sys.exit(1)
    return leads


def find_lead(leads, index=None, name=None):
    """Select a lead by index or name substring."""
    if index is not None:
        if index >= len(leads):
            print(f"ERROR: Index {index} out of range (0–{len(leads)-1})")
            sys.exit(1)
        return leads[index]

    if name:
        name_lower = name.lower()
        for lead in leads:
            if name_lower in lead["name"].lower():
                return lead
        print(f"ERROR: No lead found matching '{name}'")
        sys.exit(1)

    # Default: first lead that doesn't already have a preview
    for lead in leads:
        biz_slug = slugify(lead["name"])
        preview_path = os.path.join(PREVIEWS_DIR, biz_slug, "index.html")
        if not os.path.exists(preview_path):
            return lead

    # All leads have previews — return first
    return leads[0]


# ---------------------------------------------------------------------------
# Core: personalize HTML
# ---------------------------------------------------------------------------

def personalize_html(html, business_name, phone, city, state, template_slug):
    """
    Replace template placeholder values with actual business data.
    Handles multiple occurrence patterns found across different templates.
    """
    orig_name  = TEMPLATE_BUSINESS_NAMES.get(template_slug, "")
    orig_phone = TEMPLATE_PHONES.get(template_slug, "")
    orig_city  = TEMPLATE_CITIES.get(template_slug, "")

    # 1. Replace business name (case-sensitive full match first, then partial)
    if orig_name and orig_name in html:
        html = html.replace(orig_name, business_name)
    else:
        # Try to find name in <title> and major headings
        for pattern, replacement in [
            (r'(<title>[^<]*?)([^<-|]+?)( -[^<]+</title>)',
             lambda m: m.group(1) + business_name + m.group(3)),
        ]:
            html = re.sub(pattern, replacement, html, count=1)

    # 2. Replace phone number — handle multiple formats
    if orig_phone and orig_phone in html:
        html = html.replace(orig_phone, phone or orig_phone)
    elif phone:
        # Replace any US phone pattern in the visible content areas
        def replace_phone(m):
            return phone
        html = re.sub(
            r'\(\d{3}\)\s*\d{3}[-\s]\d{4}',
            replace_phone,
            html,
            count=3  # Replace up to 3 occurrences (nav, hero, contact)
        )

    # 3. Replace city references (only in visible text, not URLs or class names)
    if orig_city and city and orig_city != city:
        # Replace "City, State" pattern
        html = re.sub(
            rf'\b{re.escape(orig_city)}\b(?=\s*,)',
            city,
            html
        )
        # Replace standalone city mentions in text nodes (not inside attr values)
        html = re.sub(
            rf'(?<=>)([^<]*)\b{re.escape(orig_city)}\b([^<]*?)(?=<)',
            lambda m: m.group(0).replace(orig_city, city),
            html
        )

    # 4. Add HubMe AI badge if not present
    if "hubme" not in html.lower():
        badge_html = f'''
    <!-- HubMe AI Preview Badge -->
    <div style="position:fixed;bottom:16px;right:16px;background:#6366f1;color:#fff;
                padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999;
                box-shadow:0 4px 12px rgba(0,0,0,0.3);font-family:sans-serif;">
      <a href="https://go.hubme.tech" style="color:#fff;text-decoration:none;">
        Preview by HubMe AI — Want this site?
      </a>
    </div>'''
        html = html.replace("</body>", badge_html + "\n</body>")

    # 5. Update <title> to reference actual business name
    html = re.sub(
        r'<title>[^<]+</title>',
        f'<title>{business_name} — Preview by HubMe AI</title>',
        html,
        count=1
    )

    # 6. Add preview meta tag for tracking
    meta_tag = f'<meta name="hubme-preview" content="{slugify(business_name)}">'
    html = html.replace("</head>", f"  {meta_tag}\n</head>", 1)

    return html


# ---------------------------------------------------------------------------
# Preview generator
# ---------------------------------------------------------------------------

def generate_preview(lead):
    """
    Generate a personalized preview for one lead.
    Returns (business_slug, preview_url, output_path).
    """
    name   = lead["name"]
    niche  = lead.get("niche", "default")
    phone  = lead.get("phone", "")
    city   = lead.get("city", "")
    state  = lead.get("state", "")

    # Determine template
    template_slug = lead.get("template") or resolve_template(niche)
    if not template_slug:
        print(f"ERROR: No template found in {PREVIEWS_DIR}")
        return None, None, None

    template_index = os.path.join(PREVIEWS_DIR, template_slug, "index.html")
    if not os.path.exists(template_index):
        print(f"ERROR: Template not found: {template_index}")
        # Try fallback
        template_slug = NICHE_TEMPLATE_MAP["default"]
        template_index = os.path.join(PREVIEWS_DIR, template_slug, "index.html")
        if not os.path.exists(template_index):
            print(f"ERROR: Fallback template also missing.")
            return None, None, None

    # Business slug for output directory
    biz_slug = slugify(name)
    output_dir   = os.path.join(PREVIEWS_DIR, biz_slug)
    output_path  = os.path.join(output_dir, "index.html")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Copy all template assets (CSS, images, etc.) if they exist
    template_dir = os.path.join(PREVIEWS_DIR, template_slug)
    for item in os.listdir(template_dir):
        if item == "index.html":
            continue  # handled separately
        src = os.path.join(template_dir, item)
        dst = os.path.join(output_dir, item)
        if os.path.isfile(src) and not os.path.exists(dst):
            shutil.copy2(src, dst)
        elif os.path.isdir(src) and not os.path.exists(dst):
            shutil.copytree(src, dst)

    # Read template HTML
    with open(template_index, encoding="utf-8") as f:
        html = f.read()

    # Personalize
    html = personalize_html(html, name, phone, city, state, template_slug)

    # Attempt to inject a real photo into the hero section
    # 1. Try Google Places first (actual business photo)
    photo_url = get_google_places_photo(name, city)

    # 2. Fall back to Pexels / Unsplash based on niche
    if not photo_url:
        photo_url = fetch_pexels_photo(niche or template_slug)

    # 3. Inject into hero if we have a URL
    if photo_url:
        html, injected = inject_hero_photo(html, photo_url)
        if injected:
            print(f"  [photo] Hero background photo injected successfully.")
        else:
            print(f"  [photo] Could not locate hero gradient to replace — using gradient fallback.")

    # Write output
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    preview_url = f"{PREVIEW_BASE}/{biz_slug}"
    return biz_slug, preview_url, output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def list_leads(leads):
    print(f"\n{'#':<4} {'Business Name':<35} {'Niche':<14} {'City':<14} {'State':<6} {'Phone':<18} {'Has Site'}")
    print("-" * 100)
    for i, lead in enumerate(leads):
        biz_slug = slugify(lead["name"])
        preview_exists = os.path.exists(os.path.join(PREVIEWS_DIR, biz_slug, "index.html"))
        flag = "[preview]" if preview_exists else ""
        print(f"{i:<4} {lead['name'][:34]:<35} {lead.get('niche','')[:13]:<14} "
              f"{lead.get('city','')[:13]:<14} {lead.get('state',''):<6} "
              f"{lead.get('phone','')[:17]:<18} {flag}")
    print(f"\nTotal: {len(leads)} leads")


def main():
    parser = argparse.ArgumentParser(
        description="HubMe AI — Preview Generator"
    )
    parser.add_argument("--index",  type=int, default=None, help="Lead index in leads.json (0-based)")
    parser.add_argument("--name",   default=None, help="Lead name substring to search")
    parser.add_argument("--all",    action="store_true", help="Generate previews for ALL leads")
    parser.add_argument("--list",   action="store_true", help="List all leads in leads.json")
    args = parser.parse_args()

    leads = load_leads()

    if args.list:
        list_leads(leads)
        return

    if args.all:
        print(f"Generating previews for {len(leads)} leads...\n")
        success = 0
        for i, lead in enumerate(leads):
            biz_slug, preview_url, output_path = generate_preview(lead)
            if preview_url:
                print(f"[{i+1}/{len(leads)}] {lead['name']}")
                print(f"         Template : {lead.get('template', 'auto')}")
                print(f"         Output   : {output_path}")
                print(f"         URL      : {preview_url}")
                print()
                success += 1
            else:
                print(f"[{i+1}/{len(leads)}] FAILED: {lead['name']}\n")
        print(f"Done. {success}/{len(leads)} previews generated.")
        return

    # Single lead mode
    lead = find_lead(leads, index=args.index, name=args.name)

    print("=" * 60)
    print("  HubMe AI — Preview Generator")
    print("=" * 60)
    print(f"\nBusiness : {lead['name']}")
    print(f"Niche    : {lead.get('niche', 'unknown')}")
    print(f"City     : {lead.get('city', '')}{',' if lead.get('state') else ''} {lead.get('state', '')}")
    print(f"Phone    : {lead.get('phone', '(none)')}")

    template_slug = lead.get("template") or resolve_template(lead.get("niche", "default"))
    print(f"Template : {template_slug}")
    print()

    biz_slug, preview_url, output_path = generate_preview(lead)

    if not preview_url:
        print("Preview generation FAILED.")
        sys.exit(1)

    print(f"Output   : {output_path}")
    print()
    print("=" * 60)
    print(f"  PREVIEW URL: {preview_url}")
    print("=" * 60)
    print()
    print("Share this URL with the business owner:")
    print(f"  {preview_url}")


if __name__ == "__main__":
    main()
