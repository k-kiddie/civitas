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
node_ok() {
  local bin
  bin="$(command -v node || true)"
  [ -n "$bin" ] && "$bin" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)'
}
if ! node_ok; then
  echo 'Node.js 18 이상이 없어 설치합니다.'
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y ca-certificates curl
    apt-get install -y nodejs || true
    if ! node_ok; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nodejs
  else
    echo 'Ubuntu 또는 Amazon Linux 2023이 아닙니다. Node.js 18 이상을 직접 설치한 뒤 다시 실행하세요.' >&2
    exit 1
  fi
  if ! node_ok; then
    echo 'Node.js 18 이상 설치에 실패했습니다.' >&2
    exit 1
  fi
fi
node_bin="$(command -v node)"
if ! command -v curl >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then apt-get install -y curl; else dnf install -y curl-minimal || dnf install -y curl; fi
fi
current_port="$(grep -oP '^Environment=PORT=\K[0-9]+' /etc/systemd/system/civitas.service 2>/dev/null || true)"
if systemctl is-active --quiet civitas && [ "$current_port" = "$port" ]; then
  : # 기존 CIVITAS가 같은 포트를 쓰는 업데이트 상황
elif command -v ss >/dev/null 2>&1 && ss -ltnH "sport = :$port" | grep -q .; then
  echo "포트 $port 를 이미 다른 프로그램이 쓰고 있습니다. 다른 포트로 실행하세요: sudo bash deploy/install.sh 8091" >&2
  ss -ltnp "sport = :$port" >&2 || true
  exit 1
fi
source_dir="$(cd "$(dirname "$0")/.." && pwd)"
if ! id civitas >/dev/null 2>&1; then
  useradd --system --home-dir /opt/civitas --shell /usr/sbin/nologin civitas
fi
release="/opt/civitas/releases/$(date -u +%Y%m%d%H%M%S)-$$"
install -d -m 755 "$release"
for file in index.html style.css game.js agenda.js campaign.js starts.js job-stories.js careers.js institutions.js agencies.js random-events.js underworld.js politics.js parties.js council.js pacts.js family.js succession.js society.js career-echoes.js work-projects.js work-agreements.js work-incidents.js work-careers.js chronicles.js life.js server.js; do
  install -m 644 "$source_dir/$file" "$release/$file"
done
# The seasonal game is served from /next/; legacy entry and saves remain intact.
cp -R "$source_dir/src" "$release/src"
cp -R "$source_dir/next" "$release/next"
find "$release/src" "$release/next" -type d -exec chmod 755 {} +
find "$release/src" "$release/next" -type f -exec chmod 644 {} +
install -d -m 755 "$release/assets/events"
for asset in "$source_dir"/assets/events/*.webp; do
  install -m 644 "$asset" "$release/assets/events/"
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
