#!/usr/bin/env sh
# Enforce branch naming convention.
# Allowed: main, develop, or <type>/<description>
#   type ∈ feature|fix|chore|docs|refactor|test|hotfix|claude
#   description: lowercase letters, digits, '-', '_', '.', '/'
set -e

branch="$(git rev-parse --abbrev-ref HEAD)"

# Detached HEAD (e.g. rebase) — skip.
if [ "$branch" = "HEAD" ]; then
  exit 0
fi

pattern='^(main|develop|(feature|fix|chore|docs|refactor|test|hotfix|claude)\/[A-Za-z0-9._/-]+)$'

if echo "$branch" | grep -Eq "$pattern"; then
  exit 0
fi

echo "✗ Branch name '$branch' does not follow the convention."
echo "  Use: main, develop, or <type>/<desc>"
echo "  type ∈ feature|fix|chore|docs|refactor|test|hotfix|claude"
echo "  e.g. feature/rpc-inspector, fix/noupdate-write, claude/optimistic-cerf-UZBG5"
exit 1
