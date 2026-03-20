#!/bin/bash
# Clone ALL Specialist from all 11 AIOX Squads

API_URL="http://localhost:5000"

# Convert name to slug (lowercase, underscores)
to_slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -d "'" | sed 's/-/_/g'
}

# Clone specialist via API
clone_specialist() {
  local name=$1
  local youtube_url=$2
  local last_videos=${3:-10}
  local slug=$(to_slug "$name")

  echo "  🧠 Cloning: $name (slug: $slug)"

  if [ -z "$youtube_url" ] || [ "$youtube_url" == "none" ]; then
    echo "     ⏭️ Skipping - no YouTube source"
    return
  fi

  # Call API
  response=$(curl -s -X POST "$API_URL/brain/ingest" \
    -H "Content-Type: application/json" \
    -d "{
      \"slug\": \"$slug\",
      \"source_type\": \"youtube\",
      \"source_url\": \"$youtube_url\",
      \"last_n\": $last_videos
    }")

  job_id=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('job_id', 'error'))" 2>/dev/null)

  if [ "$job_id" != "error" ] && [ ! -z "$job_id" ]; then
    echo "     ✅ Job $job_id queued"
  else
    echo "     ❌ Failed: $response"
  fi

  sleep 2
}

echo "=========================================="
echo "🚀 AIOX Squad Specialist Cloning Script"
echo "=========================================="
echo ""

# ==================== TRAFFIC MASTERS ====================
echo "📊 Squad: Traffic Masters (16 specialists)"
echo "=========================================="

clone_specialist "Molly Pittman" "https://www.youtube.com/@mollypittman"
clone_specialist "Ralph Burns" "https://www.youtube.com/@ralphburns"
clone_specialist "Pedro Sobral" "https://www.youtube.com/@pedrosobraloficial"
clone_specialist "Tom Breeze" "https://www.youtube.com/@tombreeze"
clone_specialist "Kasim Aslam" "https://www.youtube.com/@kasimaslam"
clone_specialist "Depesh Mandalia" "https://www.youtube.com/@depeshmandalia"
clone_specialist "Nicholas Kusmich" "https://www.youtube.com/@nicholaskusmich"

# ==================== COPY SQUAD ====================
echo ""
echo "✍️ Squad: Copy Squad (22 specialists)"
echo "=========================================="

# These are historical/foundational figures - need to source from secondary sources
clone_specialist "Gary Halbert" "none"
clone_specialist "David Ogilvy" "none"
clone_specialist "Eugene Schwartz" "none"
clone_specialist "Claude Hopkins" "none"
clone_specialist "John Carlton" "none"

# Modern copywriters/experts
clone_specialist "Frank Kern" "https://www.youtube.com/@frankkern"
clone_specialist "Russell Brunson" "https://www.youtube.com/@russellbrunson"
clone_specialist "Ben Settle" "https://www.youtube.com/@bensettle"
clone_specialist "Stefan Georgi" "https://www.youtube.com/@stefangeorgi"

# ==================== BRAND SQUAD ====================
echo ""
echo "🎨 Squad: Brand Squad (15 specialists)"
echo "=========================================="

clone_specialist "David Aaker" "none"
clone_specialist "Marty Neumeier" "https://www.youtube.com/@martineumeier"
clone_specialist "Al Ries" "none"
clone_specialist "Denise Yohn" "https://www.youtube.com/@deniseyohn"
clone_specialist "Donald Miller" "https://www.youtube.com/@donaldmiller"

# ==================== STORYTELLING SQUAD ====================
echo ""
echo "📚 Squad: Storytelling"
echo "=========================================="

clone_specialist "David McCullough" "https://www.youtube.com/@davidmccullough"
clone_specialist "Neil Gaiman" "https://www.youtube.com/@neilgaiman"

# ==================== DATA SQUAD ====================
echo ""
echo "📊 Squad: Data Squad"
echo "=========================================="

clone_specialist "Andrew Ng" "https://www.youtube.com/@andrewng"
clone_specialist "Jeremy Howard" "https://www.youtube.com/@jeremyphoward"

# ==================== DESIGN SQUAD ====================
echo ""
echo "🎯 Squad: Design Squad"
echo "=========================================="

clone_specialist "Don Norman" "https://www.youtube.com/@donnorman"
clone_specialist "Dieter Rams" "none"

echo ""
echo "=========================================="
echo "✅ Cloning batch complete!"
echo "=========================================="
echo ""
echo "📊 Next: Monitor job progress via API"
echo "   curl http://localhost:5000/brain/job/{job_id}/status"
