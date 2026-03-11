# Nginx External Resource Allowlist Runbook

## 핵심

- 수정 파일: `/Users/smlee/optivis-nexus-fe/nexus.oprimed.com.conf`
- 리버스 프록시 컨테이너: `reverse-proxy`
- 외부 리소스 허용은 대부분 `Content-Security-Policy`에 origin 추가로 해결한다.

## 어디에 추가하나

| 리소스 | 추가할 CSP |
| --- | --- |
| 이미지 | `img-src` |
| 동영상, 오디오 | `media-src` |
| API, fetch, axios, WebSocket | `connect-src` |
| iframe | `frame-src` |
| 폰트 | `font-src` |
| 외부 스크립트 | `script-src` |
| 외부 CSS | `style-src` |

규칙:

- 전체 URL이 아니라 origin만 추가한다.
- 예: `https://media.example.com/path/a.mp4` 가 아니라 `https://media.example.com`
- `default-src *` 같이 넓게 열지 않는다.

## 추가 예시

현재처럼 CSP가 한 줄이면 필요한 지시어에 origin만 붙이면 된다.

동영상 허용 예시:

```nginx
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https://pubchem.ncbi.nlm.nih.gov; media-src 'self' blob: https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev https://media.example.com;" always;
```

API 허용 예시:

```nginx
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https://pubchem.ncbi.nlm.nih.gov; media-src 'self' blob: https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev; connect-src 'self' https://api.example.com;" always;
```

iframe 허용 예시:

```nginx
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https://pubchem.ncbi.nlm.nih.gov; media-src 'self' blob: https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;" always;
```

## Docker 반영 커맨드

### 1. 마운트된 설정 파일이면

```bash
docker exec reverse-proxy nginx -t
docker exec reverse-proxy nginx -s reload
```

한 줄:

```bash
docker exec reverse-proxy nginx -t && docker exec reverse-proxy nginx -s reload
```

### 2. 컨테이너 안으로 복사해야 하면

`conf.d` 구조:

```bash
docker cp nexus.oprimed.com.conf reverse-proxy:/etc/nginx/conf.d/nexus.oprimed.com.conf
docker exec reverse-proxy nginx -t && docker exec reverse-proxy nginx -s reload
```

`sites-available` 구조:

```bash
docker cp nexus.oprimed.com.conf reverse-proxy:/etc/nginx/sites-available/nexus.oprimed.com.conf
docker exec reverse-proxy nginx -t && docker exec reverse-proxy nginx -s reload
```

### 3. 실제 로드된 설정 확인

```bash
docker exec reverse-proxy nginx -T
```

### 4. 응답 헤더 확인

```bash
curl -I https://nexus.oprimed.com | grep -i content-security-policy
```

## 빠른 판단 기준

- 콘솔에 `violates the following Content Security Policy directive`가 보이면 CSP 수정 대상이다.
- 404면 URL 또는 파일 문제다.
- 403이면 권한 문제다.
- `blocked by CORS policy`면 Nginx CSP가 아니라 CORS 문제다.

## 운영 절차

1. 브라우저 콘솔에서 막힌 URL과 리소스 타입 확인
2. 해당 CSP에 origin 추가
3. `docker exec reverse-proxy nginx -t`
4. `docker exec reverse-proxy nginx -s reload`
5. 브라우저 새로고침 후 재확인
