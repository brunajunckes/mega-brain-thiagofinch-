#!/bin/bash
# Validate AIOX Engine structure

echo "🔍 Validating AIOX Engine structure..."

errors=0

# Check required directories
for dir in api router cache memory tests docker monitoring; do
    if [ -d "$dir" ]; then
        echo "✅ Directory: $dir/"
    else
        echo "❌ Missing directory: $dir/"
        errors=$((errors + 1))
    fi
done

# Check required files
files=(
    "docker-compose.yml"
    "docker/Dockerfile"
    "requirements.txt"
    "api/main.py"
    "router/selector.py"
    "memory/store.py"
    ".env.example"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ File: $file"
    else
        echo "❌ Missing file: $file"
        errors=$((errors + 1))
    fi
done

# Check __init__.py files
for pkg in router memory; do
    if [ -f "$pkg/__init__.py" ]; then
        echo "✅ Package: $pkg/__init__.py"
    else
        echo "❌ Missing: $pkg/__init__.py"
        errors=$((errors + 1))
    fi
done

# Check for syntax errors in Python files
echo ""
echo "🔍 Checking Python syntax..."
for py_file in router/selector.py memory/store.py api/main.py; do
    if python3 -m py_compile "$py_file" 2>/dev/null; then
        echo "✅ Syntax OK: $py_file"
    else
        echo "❌ Syntax error: $py_file"
        errors=$((errors + 1))
    fi
done

echo ""
if [ $errors -eq 0 ]; then
    echo "✅ All validation checks passed!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. docker-compose up -d"
    echo "  2. Wait for services to start (check logs)"
    echo "  3. curl -X POST http://localhost:8000/agent \\"
    echo "       -H 'Content-Type: application/json' \\"
    echo "       -d '{\"prompt\": \"hello world\"}'"
    exit 0
else
    echo "❌ Validation failed with $errors errors"
    exit 1
fi
