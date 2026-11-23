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

## 업데이트

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
