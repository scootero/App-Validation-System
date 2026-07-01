#!/usr/bin/env bash
# commit-all-repos.sh — add, commit, push all platform git repos
#
# Order: nested repos first, then parent (updates gitlink pointers).
#
# Usage:
#   ./commit-all-repos.sh "your commit message"
#   ./commit-all-repos.sh "your commit message" --include-human-lab

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MSG="${1:-}"
INCLUDE_HUMAN_LAB=false

if [[ "${2:-}" == "--include-human-lab" ]]; then
  INCLUDE_HUMAN_LAB=true
fi

if [[ -z "$MSG" ]]; then
  echo "Usage: $0 \"commit message\" [--include-human-lab]"
  exit 1
fi

REPOS=(
  "app-validation-spec"
  "landing-template"
  "app-package-starter"
)

if [[ "$INCLUDE_HUMAN_LAB" == true ]]; then
  REPOS+=("test-app-packages/human-lab")
fi

commit_and_push() {
  local dir="$1"
  local label="$2"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 $label"

  if [[ ! -d "$dir/.git" ]]; then
    echo "   ⏭  No .git — skipping"
    return 0
  fi

  cd "$dir"

  if [[ -z "$(git status --porcelain)" ]]; then
    echo "   ✓  Nothing to commit"
    cd "$ROOT"
    return 0
  fi

  git add -A
  git commit -m "$MSG"

  local branch
  branch="$(git branch --show-current)"
  if [[ "$branch" != "main" ]]; then
    echo "   ⚠  On branch '$branch' (not main)"
  fi

  git push -u origin "$branch"
  echo "   ✓  Pushed $branch"
  cd "$ROOT"
}

echo "Committing nested repos..."
for name in "${REPOS[@]}"; do
  commit_and_push "$ROOT/$name" "$name"
done

echo ""
echo "Committing parent workspace..."
commit_and_push "$ROOT" "App-Validation-System (parent)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done."
