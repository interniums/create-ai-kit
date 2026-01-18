#!/bin/bash
# Find all @docs-update and @docs-discrepancy markers in the codebase
# Usage: npm run docs:find-markers

echo "🔍 Searching for documentation markers...\n"

# Check if ripgrep is available
if command -v rg &> /dev/null; then
    echo "=== @docs-update markers (new content needed) ===\n"
    rg "@docs-update" \
        --no-heading \
        --line-number \
        --color=always \
        --glob "!node_modules" \
        --glob "!.next" \
        --glob "!*.json" \
        --glob "!*.md" \
        --context 1 || echo "  (none found)"

    echo "\n=== @docs-discrepancy markers (docs out of sync) ===\n"
    rg "@docs-discrepancy" \
        --no-heading \
        --line-number \
        --color=always \
        --glob "!node_modules" \
        --glob "!.next" \
        --glob "!*.json" \
        --glob "!*.md" \
        --context 1 || echo "  (none found)"
else
    # Fallback to grep if rg is not available
    echo "=== @docs-update markers (new content needed) ===\n"
    grep -r "@docs-update" \
        --line-number \
        --color=always \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude="*.json" \
        --exclude="*.md" \
        --context=1 \
        . || echo "  (none found)"

    echo "\n=== @docs-discrepancy markers (docs out of sync) ===\n"
    grep -r "@docs-discrepancy" \
        --line-number \
        --color=always \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude="*.json" \
        --exclude="*.md" \
        --context=1 \
        . || echo "  (none found)"
fi

echo "\n✅ Search complete. Review markers above before running weekly doc update."
echo "📝 Run 'npm run docs:update' to generate context for documentation updates."
