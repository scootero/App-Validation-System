#!/usr/bin/env bash
# commit-all-repos.sh — add, commit, push all platform git repos to origin/main
#
# No pull. Local changes win — pushes your work as the latest on GitHub.
# Order: nested repos first, then parent (updates gitlink pointers).
#
# Usage:
#   ./commit-all-repos.sh "your commit message"

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MSG="${1:-}"

if [[ -z "$MSG" ]]; then
  echo "Usage: $0 \"commit message\""
  exit 1
fi

REPOS=(
  "app-validation-spec"
  "landing-template"
  "app-package-starter"
  "test-app-packages/human-lab"
)

commit_and_push() {
  local dir="$1"
  local label="$2"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 $label"

  if [[ ! -d "$dir/.git" ]]; then
    echo "   ⏭  No .git — skipping"
    return 0
  fi

  local branch
  branch="$(git -C "$dir" branch --show-current)"
  if [[ "$branch" != "main" ]]; then
    echo "   ⚠  On branch '$branch' — expected main, skipping"
    return 0
  fi

  git -C "$dir" add -A

  if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
    git -C "$dir" commit -m "$MSG"
    echo "   ✓  Committed"
  else
    echo "   ✓  Nothing to commit"
  fi

  git -C "$dir" push origin main
  echo "   ✓  Pushed to origin/main"
}

echo "Committing and pushing nested repos..."
for name in "${REPOS[@]}"; do
  commit_and_push "$ROOT/$name" "$name"
done

echo ""
echo "Committing and pushing parent workspace..."
commit_and_push "$ROOT" "App-Validation-System (parent)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done."
