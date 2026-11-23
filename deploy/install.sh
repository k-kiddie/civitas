#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then
  echo 'sudo bash deploy/install.sh [포트]로 실행하세요.' >&2
  exit 1
fi
port="${1:-8090}"
if ! [[ "$port" =~ ^[0-9]+$ ]] || ((port < 1024 || port > 65535)); then
  echo '포트는 1024~65535 정수여야 합니다.' >&2
  exit 1
fi
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ] || ! "$node_bin" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)'; then
  echo '먼저 시스템 Node.js 18 이상을 설치하세요.' >&2
  exit 1
fi
source_dir="$(cd "$(dirname "$0")/.." && pwd)"
if ! id civitas >/dev/null 2>&1; then
  useradd --system --home-dir /opt/civitas --shell /usr/sbin/nologin civitas
fi
release="/opt/civitas/releases/$(date -u +%Y%m%d%H%M%S)-$$"
install -d -m 755 "$release"
for file in index.html style.css game.js campaign.js server.js; do
  install -m 644 "$source_dir/$file" "$release/$file"
done
"$node_bin" --check "$release/server.js"
"$node_bin" --check "$release/campaign.js"
ln -s "$release" /opt/civitas/current-next
mv -Tf /opt/civitas/current-next /opt/civitas/current
cat > /etc/systemd/system/civitas.service <<UNIT
[Unit]
Description=CIVITAS mobile strategy game
After=network.target
[Service]
Type=simple
User=civitas
Group=civitas
WorkingDirectory=/opt/civitas/current
Environment=PORT=$port
ExecStart=$node_bin /opt/civitas/current/server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable civitas
systemctl restart civitas
for attempt in {1..20}; do
  if curl --fail --silent "http://127.0.0.1:$port/healthz"; then
    echo
    echo "CIVITAS 실행 완료 · 포트 $port"
    exit 0
  fi
  sleep 1
done
journalctl -u civitas -n 25 --no-pager
exit 1
