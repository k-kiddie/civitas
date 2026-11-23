#!/usr/bin/env bash
# CIVITAS 자동 업데이트 설치기.
# /opt/civitas/repo 에 저장소를 두고, 서비스가 시작·재시작될 때마다 main을 받아(git pull --ff-only) 실행한다.
# 받기에 실패해도(네트워크·인증 문제) 기존 코드로 서버는 켜진다.
# 사용: gh auth login 을 한 계정에서  sudo bash deploy/install-auto.sh [포트]   (기본 8090)
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then
  echo 'sudo bash deploy/install-auto.sh [포트]로 실행하세요.' >&2
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
    apt-get install -y ca-certificates curl nodejs || true
    if ! node_ok; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
      apt-get install -y nodejs
    fi
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nodejs
  fi
  node_ok || { echo 'Node.js 18 이상 설치에 실패했습니다.' >&2; exit 1; }
fi
for tool in git curl; do
  command -v "$tool" >/dev/null 2>&1 || { command -v apt-get >/dev/null 2>&1 && apt-get install -y "$tool" || dnf install -y "$tool"; }
done
node_bin="$(command -v node)"
git_bin="$(command -v git)"

current_port="$(grep -oP '^Environment=PORT=\K[0-9]+' /etc/systemd/system/civitas.service 2>/dev/null || true)"
if systemctl is-active --quiet civitas && [ "$current_port" = "$port" ]; then
  : # 같은 포트의 기존 CIVITAS를 바꾸는 상황
elif command -v ss >/dev/null 2>&1 && ss -ltnH "sport = :$port" | grep -q .; then
  echo "포트 $port 를 이미 다른 프로그램이 쓰고 있습니다. 다른 포트로 실행하세요: sudo bash deploy/install-auto.sh 8091" >&2
  exit 1
fi

repo=/opt/civitas/repo
remote=https://github.com/k-kiddie/civitas.git
if ! id civitas >/dev/null 2>&1; then
  useradd --system --home-dir /opt/civitas --shell /usr/sbin/nologin civitas
fi
install -d -m 755 /opt/civitas
if [ ! -d "$repo/.git" ]; then
  git init --quiet "$repo"
  git -C "$repo" remote add origin "$remote"
fi
git -C "$repo" remote set-url origin "$remote"

# 비공개 저장소: 설치한 사람의 gh 로그인 정보로 받는다(토큰을 따로 파일에 적지 않음).
owner="${SUDO_USER:-root}"
owner_home="$(getent passwd "$owner" | cut -d: -f6)"
gh_bin="$(command -v gh || true)"
git -C "$repo" config --unset-all credential.helper 2>/dev/null || true
if [ -n "$gh_bin" ] && sudo -u "$owner" -H "$gh_bin" auth status >/dev/null 2>&1; then
  git -C "$repo" config credential.helper "!GH_CONFIG_DIR=$owner_home/.config/gh $gh_bin auth git-credential"
else
  echo '주의: gh 로그인이 확인되지 않았습니다. 먼저 gh auth login 을 하세요.' >&2
fi

if HOME=/root GIT_TERMINAL_PROMPT=0 timeout 60 git -C "$repo" fetch --quiet origin main; then
  git -C "$repo" checkout --quiet -f -B main origin/main
  git -C "$repo" branch --quiet --set-upstream-to=origin/main main
elif [ -f "$repo/server.js" ]; then
  echo '주의: GitHub에서 main을 받지 못했습니다. 지금 가진 코드로 실행합니다.' >&2
else
  echo 'GitHub에서 civitas를 받지 못했습니다. gh auth login 후 다시 실행하세요.' >&2
  exit 1
fi
"$node_bin" --check "$repo/server.js"

cat > /etc/systemd/system/civitas.service <<UNIT
[Unit]
Description=CIVITAS mobile strategy game (auto update)
Wants=network-online.target
After=network-online.target
[Service]
Type=simple
User=civitas
Group=civitas
WorkingDirectory=$repo
Environment=PORT=$port
# 시작할 때 main 받기(+: root 권한, -: 실패해도 계속).
ExecStartPre=+-/usr/bin/timeout 60 /usr/bin/env HOME=/root GIT_TERMINAL_PROMPT=0 $git_bin -C $repo pull --ff-only --quiet origin main
ExecStart=$node_bin $repo/server.js
Restart=always
RestartSec=5
TimeoutStartSec=90
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable civitas >/dev/null
systemctl restart civitas
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$port/healthz" >/dev/null; then
    echo "CIVITAS 실행 완료 · 포트 $port · $(git -C "$repo" log --oneline -1)"
    exit 0
  fi
  sleep 1
done
journalctl -u civitas -n 25 --no-pager
exit 1
