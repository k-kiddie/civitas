# AWS EC2 배포

Ubuntu(22.04/24.04) 또는 Amazon Linux 2023의 systemd로 실행합니다. 기본 포트는 8090입니다. Node.js 18 이상이 없으면 설치기가 자동으로 설치합니다.

## 1. EC2 보안 그룹

인스턴스의 보안 그룹 인바운드 규칙에 다음을 추가합니다.

- 유형: 사용자 지정 TCP · 포트: 8090 · 소스: 내 IP(혼자 테스트) 또는 0.0.0.0/0(공개)

설치기는 보안 그룹을 바꾸지 않습니다.

## 2. 서버에 소스 올리기

비공개 저장소이므로 둘 중 하나를 씁니다. 토큰을 명령줄이나 파일에 직접 적지 마세요.

**A. 서버에서 GitHub CLI로 로그인 후 clone**

```sh
# Ubuntu: sudo apt-get install -y gh   /  Amazon Linux: sudo dnf install -y gh
gh auth login          # 브라우저 코드 인증 방식 선택
gh repo clone k-kiddie/civitas
cd civitas
```

**B. Windows PC에서 압축해 SSH로 전송**

```powershell
git -C C:\경로\civitas archive -o civitas.tar.gz HEAD
scp -i 키.pem civitas.tar.gz ubuntu@EC2공인IP:~
ssh -i 키.pem ubuntu@EC2공인IP "mkdir -p civitas && tar -xzf civitas.tar.gz -C civitas"
```

Amazon Linux는 사용자 이름이 `ec2-user`입니다.

## 3. 설치·실행

```sh
cd ~/civitas
sudo bash deploy/install.sh 8090
```

설치기는 `civitas` 서비스 계정과 `/opt/civitas/releases/<시각>` 배포본을 만들고, `/opt/civitas/current`를 새 배포본으로 바꾼 뒤 systemd 서비스 `civitas`를 시작합니다. 재부팅 후에도 자동 실행되며 이전 배포본은 보관합니다. 포트를 다른 프로그램이 쓰고 있으면 중단하고 알려 주니 다른 포트로 다시 실행하세요.

브라우저에서 `http://EC2공인IP:8090` 으로 접속합니다.

## 자동 업데이트 설치 (free-village 서버와 같이 쓰기, 권장)

free-village가 80번 포트에서 돌고 있으면 `http://주소/civitas`로 들어갈 수 있습니다. free-village 서버가 이 경로를 CIVITAS(127.0.0.1:8090)로 넘겨 주므로 보안 그룹에 8090을 열 필요가 없습니다. 8090을 열면 `http://주소:8090`으로도 열립니다.

```sh
sudo apt-get install -y gh           # 없을 때만
gh auth login                        # 비공개 저장소 받기용, 한 번만
gh repo clone k-kiddie/civitas ~/civitas
sudo bash ~/civitas/deploy/install-auto.sh 8090
```

- free-village 없이 단독으로 쓰면 포트를 80으로 줍니다: `sudo bash ~/civitas/deploy/install-auto.sh 80`. `http://주소`와 `http://주소/civitas` 둘 다 열리고 보안 그룹은 80만 있으면 됩니다.
- `/opt/civitas/repo`에 main을 받아 그 자리에서 실행합니다.
- 서비스가 시작·재시작될 때마다 `git pull --ff-only origin main`을 합니다. EC2를 켤 때마다 최신 main으로 실행됩니다. 받기에 실패해도 기존 코드로 켜집니다.
- 받기는 설치한 계정의 `gh` 로그인 정보를 사용하고, 토큰을 따로 파일에 적지 않습니다. `gh auth logout`을 하면 자동 업데이트가 멈춥니다.
- 켜진 상태에서 바로 반영하려면 `sudo systemctl restart civitas`를 실행합니다.
- 반영 확인: `sudo git -C /opt/civitas/repo log --oneline -1`

## 업데이트 (위 설치기를 쓰지 않은 경우)

```sh
cd ~/civitas && git pull --ff-only     # B 방식은 압축 파일을 다시 전송
sudo bash deploy/install.sh 8090
```

## 확인·문제 해결

```sh
sudo systemctl status civitas
curl --fail http://127.0.0.1:8090/healthz
sudo journalctl -u civitas -n 100 --no-pager
```

서버 안에서 `/healthz`는 되는데 밖에서 안 열리면 보안 그룹 포트를 확인하세요. 도메인과 HTTPS를 쓰려면 기존 리버스 프록시(nginx 등)에 이 포트를 연결합니다.


## 계절 배치 시제품 경로

`server.js`와 정적 설치기 모두 `src/`·`next/`를 포함합니다. 기존 Node 서비스·포트·free-village의 `/civitas/` 프록시 설정은 그대로 사용할 수 있습니다.

- 기존 게임: `http://서버주소:포트/` 또는 기존 프록시의 `/civitas/`
- 새 시제품: `http://서버주소:포트/next/` 또는 기존 프록시의 `/civitas/next/`
- 상태 확인: `/healthz` 또는 `/civitas/healthz`

새 코드는 별도 브랜치/PR에 있으므로 자동 업데이트 서비스가 추적하는 `main`에 반영되기 전에는 운영 서버에 자동 적용되지 않습니다. 이 작업에서는 실제 AWS 서버를 변경하지 않았습니다.

이번 시제품의 저장은 기기 기준입니다. 서버에 저장 파일이나 계정 정보가 생기지 않으며 기존 게임 저장 키도 변경하지 않습니다.
