#!/usr/bin/env bash
# 로컬에서 실행: Docker 이미지 빌드 -> tar 파일 생성 (Nexus FE, 포트 3006)
# 사용법: ./create-tar.sh [linux/amd64|linux/arm64]

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

IMAGE_NAME="optivis-nexus-fe"
IMAGE_TAG="latest"
IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
TARGET_PLATFORM="${1:-${TARGET_PLATFORM:-linux/amd64}}"

case "${TARGET_PLATFORM}" in
    linux/amd64|linux/arm64)
        ;;
    *)
        echo -e "${RED}❌ 지원하지 않는 플랫폼: ${TARGET_PLATFORM}${NC}"
        echo -e "${YELLOW}허용값: linux/amd64 또는 linux/arm64${NC}"
        exit 1
        ;;
esac

echo "📦 Nexus FE tar 파일 생성..."
echo -e "${BLUE}대상 플랫폼: ${TARGET_PLATFORM}${NC}"

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker 데몬에 연결할 수 없습니다.${NC}"
    echo -e "${YELLOW}Docker Desktop(또는 Docker Engine) 실행 후 다시 시도하세요.${NC}"
    exit 1
fi

echo -e "${BLUE}1/3: Docker 이미지 빌드 중...${NC}"
docker build --no-cache --platform "${TARGET_PLATFORM}" -t "${IMAGE_REF}" .

IMAGE_PLATFORM="$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "${IMAGE_REF}" 2>/dev/null || true)"
if [ -z "${IMAGE_PLATFORM}" ]; then
    echo -e "${RED}❌ 빌드된 이미지 플랫폼 확인 실패${NC}"
    exit 1
fi
IMAGE_ID="$(docker image inspect --format '{{.Id}}' "${IMAGE_REF}" 2>/dev/null || true)"
IMAGE_CREATED="$(docker image inspect --format '{{.Created}}' "${IMAGE_REF}" 2>/dev/null || true)"
if [ "${IMAGE_PLATFORM}" != "${TARGET_PLATFORM}" ]; then
    echo -e "${RED}❌ 요청 플랫폼(${TARGET_PLATFORM})과 빌드 결과(${IMAGE_PLATFORM})가 다릅니다.${NC}"
    echo -e "${YELLOW}플랫폼 불일치 상태로는 진행하지 않습니다.${NC}"
    exit 1
fi

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
TAR_FILE="${IMAGE_NAME}_${TIMESTAMP}.tar"
echo -e "${BLUE}2/3: tar 파일 생성 중...${NC}"
docker save -o "${TAR_FILE}" "${IMAGE_REF}"

if stat --version >/dev/null 2>&1; then
    FILE_SIZE_BYTES="$(stat -c%s "${TAR_FILE}")"
else
    FILE_SIZE_BYTES="$(stat -f%z "${TAR_FILE}")"
fi

if [ ! -s "${TAR_FILE}" ] || [ "${FILE_SIZE_BYTES}" -le 0 ]; then
    echo -e "${RED}❌ tar 파일이 비어있거나 생성에 실패했습니다: ${TAR_FILE}${NC}"
    exit 1
fi

FILE_SIZE_HUMAN="$(du -h "${TAR_FILE}" | awk '{print $1}')"

echo -e "${GREEN}3/3: 완료${NC}"
echo -e "${GREEN}✅ tar 파일 생성 완료!${NC}"
echo -e "${GREEN}📦 파일: ${TAR_FILE}${NC}"
echo -e "${GREEN}🏷️ 이미지: ${IMAGE_REF} (${IMAGE_PLATFORM})${NC}"
echo -e "${GREEN}🆔 이미지 ID: ${IMAGE_ID}${NC}"
echo -e "${GREEN}🕒 이미지 생성시각(UTC): ${IMAGE_CREATED}${NC}"
echo -e "${GREEN}📊 크기: ${FILE_SIZE_HUMAN} (${FILE_SIZE_BYTES} bytes)${NC}"
echo
echo -e "${YELLOW}🚀 서버 배포:${NC}"
echo -e "${BLUE}macOS/Linux: ./load.sh \"${TAR_FILE}\" ${TARGET_PLATFORM}${NC}"
