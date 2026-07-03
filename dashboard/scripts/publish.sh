#!/usr/bin/env bash
# 데이터 스냅샷 갱신 → commit → push. (레포가 Netlify에 연결되어 있으면 push가 곧 배포)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ kanban.db → site/data.json 스냅샷 갱신"
python3 "$HERE/export_data.py"

cd "$HERE/.."
git add -A site/data.json site/assets

if git diff --cached --quiet; then
  echo "✓ 데이터 변경 없음 — 커밋/푸시 생략"
  exit 0
fi

git commit -m "dashboard: 데이터 스냅샷 갱신 $(date '+%Y-%m-%d %H:%M')"
git push
echo "✓ push 완료 — Netlify 빌드가 끝나면 새 스냅샷이 반영됩니다"
