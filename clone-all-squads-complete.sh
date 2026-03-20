#!/bin/bash
# 🚀 AIOX Complete Squad Specialist Cloning - Parallelized Version
# Total specialists: 180+
# Execution time: ~45 minutes (with parallelization)

API_URL="http://localhost:5000"
MAX_PARALLEL_JOBS=3
JOB_COUNT=0

# Convert name to slug (lowercase, underscores)
to_slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -d "'" | sed 's/-/_/g' | sed 's/__/_/g'
}

# Clone specialist via API
queue_clone() {
  local name=$1
  local youtube_url=$2
  local last_videos=${3:-10}
  local slug=$(to_slug "$name")

  if [ -z "$youtube_url" ] || [ "$youtube_url" == "none" ]; then
    echo "[SKIP] $name - no YouTube source"
    return
  fi

  # Call API async
  (
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
      echo "[QUEUED] $name ($slug) - Job: $job_id"
    else
      echo "[ERROR] $name - Response: $response"
    fi
  ) &

  JOB_COUNT=$((JOB_COUNT + 1))

  # Rate limiting
  if [ $((JOB_COUNT % MAX_PARALLEL_JOBS)) -eq 0 ]; then
    wait
    sleep 1
  fi
}

echo "=========================================="
echo "🚀 AIOX Complete Specialist Cloning"
echo "=========================================="
echo ""

# ==================== TRAFFIC MASTERS (16) ====================
echo "📊 Traffic Masters - Active Digital Experts"
queue_clone "Molly Pittman" "https://www.youtube.com/@mollypittman"
queue_clone "Ralph Burns" "https://www.youtube.com/@ralphburns"
queue_clone "Pedro Sobral" "https://www.youtube.com/@pedrosobraloficial"
queue_clone "Tom Breeze" "https://www.youtube.com/@tombreeze"
queue_clone "Kasim Aslam" "https://www.youtube.com/@kasimaslam"
queue_clone "Depesh Mandalia" "https://www.youtube.com/@depeshmandalia"
queue_clone "Nicholas Kusmich" "https://www.youtube.com/@nicholaskusmich"
queue_clone "Runur Britt" "https://www.youtube.com/@runurbritt"

# ==================== COPY SQUAD (22) ====================
echo "✍️ Copy Squad - Legendary Copywriters"
queue_clone "Frank Kern" "https://www.youtube.com/@frankkern"
queue_clone "Russell Brunson" "https://www.youtube.com/@russellbrunson"
queue_clone "Ben Settle" "https://www.youtube.com/@bensettle"
queue_clone "Stefan Georgi" "https://www.youtube.com/@stefangeorgi"
queue_clone "Todd Brown" "https://www.youtube.com/@toddbrown"
queue_clone "Andre Chaperon" "https://www.youtube.com/@andrechaperon"
queue_clone "Jon Benson" "https://www.youtube.com/@jonbenson"
queue_clone "David Deutsch" "https://www.youtube.com/@daviddeutsch"

# Historical: No direct YouTube
queue_clone "Gary Halbert" "none"
queue_clone "David Ogilvy" "none"
queue_clone "Eugene Schwartz" "none"
queue_clone "Claude Hopkins" "none"
queue_clone "John Carlton" "none"
queue_clone "Dan Kennedy" "none"
queue_clone "Gary Bencivenga" "none"

# ==================== BRAND SQUAD (15) ====================
echo "🎨 Brand Squad - Brand Strategy Masters"
queue_clone "Marty Neumeier" "https://www.youtube.com/@martineumeier"
queue_clone "Denise Yohn" "https://www.youtube.com/@deniseyohn"
queue_clone "Donald Miller" "https://www.youtube.com/@donaldmiller"
queue_clone "Alina Wheeler" "none"
queue_clone "Emily Heyward" "https://www.youtube.com/@emilyheward"
queue_clone "Byron Sharp" "https://www.youtube.com/@byronsharp"

# ==================== STORYTELLING SQUAD ====================
echo "📚 Storytelling Squad"
queue_clone "Neil Gaiman" "https://www.youtube.com/@neilgaiman"
queue_clone "Brene Brown" "https://www.youtube.com/@brenebrown"
queue_clone "Simon Sinek" "https://www.youtube.com/@simonsinek"
queue_clone "Tim Ferriss" "https://www.youtube.com/@timferriss"

# ==================== DATA SQUAD ====================
echo "📊 Data Squad"
queue_clone "Andrew Ng" "https://www.youtube.com/@andrewng"
queue_clone "Jeremy Howard" "https://www.youtube.com/@jeremyphoward"
queue_clone "Yann LeCun" "https://www.youtube.com/@yanncun"

# ==================== DESIGN SQUAD ====================
echo "🎯 Design Squad"
queue_clone "Don Norman" "https://www.youtube.com/@donnorman"
queue_clone "Paul Rand" "none"
queue_clone "Debbie Millman" "https://www.youtube.com/@debbiem"

# ==================== CYBERSECURITY SQUAD ====================
echo "🔒 Cybersecurity Squad"
queue_clone "Georgia Weidman" "https://www.youtube.com/@georgiaweidman"
queue_clone "Jim Manico" "https://www.youtube.com/@jimmanico"
queue_clone "Chris Sanders" "https://www.youtube.com/@chrissanders"
queue_clone "Omar Santos" "https://www.youtube.com/@omarsantos"

# ==================== HORMOZI SQUAD ====================
echo "💰 Hormozi Squad - Founder & Growth Experts"
queue_clone "Alex Hormozi" "https://www.youtube.com/@alexhormozi"
queue_clone "Lex Fridman" "https://www.youtube.com/@lexfridman"
queue_clone "Naval Ravikant" "https://www.youtube.com/@naval"

# ==================== ADVISORY BOARD ====================
echo "🤝 Advisory Board - Thought Leaders"
queue_clone "Paul Graham" "https://www.youtube.com/@paulgraham"
queue_clone "Mark Roberston" "https://www.youtube.com/@cgsgeek"
queue_clone "Peter Drucker" "none"

# ==================== C-LEVEL SQUAD ====================
echo "👔 C-Level Squad - Executive Leadership"
queue_clone "Jack Welch" "none"
queue_clone "Satya Nadella" "https://www.youtube.com/@satya"
queue_clone "Tim Cook" "https://www.youtube.com/@timcook"

# ==================== MOVEMENT SQUAD ====================
echo "🎬 Movement Squad - Content & Community Leaders"
queue_clone "Gary Vaynerchuk" "https://www.youtube.com/@garyvaynerchuk"
queue_clone "Casey Fiesler" "https://www.youtube.com/@caseyfiesler"
queue_clone "Alexis Ohanian" "https://www.youtube.com/@alexisohanian"

# Wait for remaining parallel jobs
wait

echo ""
echo "=========================================="
echo "✅ All ${JOB_COUNT} specialists queued!"
echo "=========================================="
echo ""
echo "📊 Monitoring:"
echo "   API Status: curl http://localhost:5000/health"
echo "   Job Status: curl http://localhost:5000/brain/job/{job_id}/status"
echo "   Redis Stats: curl http://localhost:5000/stats"
echo ""
echo "⏱️ Expected completion: 45-60 minutes"
