# AWS EC2 배포

Ubuntu 또는 Amazon Linux의 systemd와 시스템 Node.js 18 이상을 사용합니다. 기본 포트는 8090입니다. 기존 서비스와 포트가 겹치는지 확인한 뒤 다른 포트도 지정할 수 있습니다.

## 서버에서 설치

이 비공개 저장소를 읽을 수 있는 GitHub 인증으로 소스를 가져옵니다. 인증 토큰을 명령줄이나 파일에 기록하지 마세요. 또는 로컬 소스의 추적 파일을 압축해 SSH로 서버에 전송합니다.

```sh
git clone https://github.com/k-kiddie/civitas.git
cd civitas
sudo bash deploy/install.sh 8090
```

설치기는 독립 서비스 계정과 `/opt/civitas/releases`에 배포본을 만듭니다. `/opt/civitas/current`를 새 배포본으로 바꾸고 systemd 서비스 `civitas`를 자동 시작합니다. 서버 재부팅 시에도 실행됩니다. 이전 배포본은 보관합니다.

## 업데이트

```sh
git pull --ff-only
sudo bash deploy/install.sh 8090
sudo systemctl status civitas
curl --fail http://127.0.0.1:8090/healthz
```

EC2 보안 그룹에 선택한 포트의 인바운드 접근을 허용하면 `http://EC2공인IP:8090`으로 접속합니다. 도메인과 HTTPS를 쓰는 경우 기존 리버스 프록시에 이 포트를 연결합니다. 설치기는 보안 그룹과 기존 프록시를 변경하지 않습니다.

로그는 `sudo journalctl -u civitas -n 100 --no-pager`로 확인합니다. 원격 서버 접속과 외부 HTTP 응답을 확인하기 전에는 배포 완료로 간주하지 않습니다.
