#!/usr/bin/env bash
# kanban.db 스냅샷을 내보내고 Netlify(agentsoperation)에 배포한다.
#
# 사전 준비 (최초 1회):
#   npx --yes netlify-cli login          # 브라우저 인증
#   또는 export NETLIFY_AUTH_TOKEN=...   # https://app.netlify.com/user/applications 에서 발급
#
# 사용법:
#   ./deploy.sh            # 데이터 내보내기 + 프로덕션 배포
#   ./deploy.sh --export   # 데이터 내보내기만 (배포 생략)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASH_DIR="$(dirname "$HERE")"
SITE_NAME="${NETLIFY_SITE_NAME:-agentsoperation}"

echo "▶ kanban.db → site/data.json"
python3 "$HERE/export_data.py"

if [[ "${1:-}" == "--export" ]]; then
  echo "✓ export 완료 (배포 생략)"
  exit 0
fi

echo "▶ Netlify 배포 (site: $SITE_NAME)"
cd "$DASH_DIR"
npx --yes netlify-cli deploy --prod --dir site --site "$SITE_NAME"
echo "✓ 배포 완료 → https://${SITE_NAME}.netlify.app/"
