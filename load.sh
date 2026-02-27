#!/usr/bin/env bash
# 서버에서 실행: tar import -> 컨테이너 실행 (Nexus FE, 포트 3006)
# 사용법: ./load.sh [tar_file] [linux/amd64|linux/arm64]

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

IMAGE_REF="optivis-nexus-fe:latest"
CONTAINER_NAME="optivis-nexus-fe"
PORT="3006"
TAR_FILE="${1:-}"
REQUESTED_PLATFORM="${2:-}"

echo "🚀 Nexus FE 서버 배포..."

if [ -z "${TAR_FILE}" ]; then
    mapfile -t TAR_CANDIDATES < <(ls -1t optivis-nexus-fe_*.tar 2>/dev/null || true)
    if [ "${#TAR_CANDIDATES[@]}" -eq 0 ]; then
        echo -e "${RED}❌ tar 파일을 찾을 수 없습니다.${NC}"
        echo -e "${YELLOW}사용법: ./load.sh <파일명.tar> [linux/amd64|linux/arm64]${NC}"
        exit 1
    fi
    if [ "${#TAR_CANDIDATES[@]}" -gt 1 ]; then
        echo -e "${RED}❌ tar 파일이 여러 개입니다. 배포할 파일을 명시하세요.${NC}"
        echo -e "${YELLOW}예시: ./load.sh optivis-nexus-fe_20260227_154110.tar linux/amd64${NC}"
        echo -e "${BLUE}후보 목록:${NC}"
        printf '%s\n' "${TAR_CANDIDATES[@]}"
        exit 1
    fi
    TAR_FILE="${TAR_CANDIDATES[0]}"
fi
if [ -z "${TAR_FILE}" ] || [ ! -f "${TAR_FILE}" ]; then
    echo -e "${RED}❌ tar 파일을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}사용법: ./load.sh <파일명.tar> [linux/amd64|linux/arm64]${NC}"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker 데몬에 연결할 수 없습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}📦 배포 파일: ${TAR_FILE}${NC}"

echo -e "${GREEN}1/5: 기존 컨테이너 중지...${NC}"
docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true

echo -e "${GREEN}2/5: Docker 이미지 import 중...${NC}"
LOAD_OUTPUT="$(docker load -i "${TAR_FILE}" 2>&1)" || {
    echo -e "${RED}❌ docker load 실패${NC}"
    echo "${LOAD_OUTPUT}"
    exit 1
}
echo "${LOAD_OUTPUT}"
LOADED_IMAGE_REF="$(printf '%s\n' "${LOAD_OUTPUT}" | sed -n 's/^Loaded image: //p' | tail -n1)"
if [ -n "${LOADED_IMAGE_REF}" ] && [ "${LOADED_IMAGE_REF}" != "${IMAGE_REF}" ]; then
    echo -e "${YELLOW}ℹ️ 로드된 태그(${LOADED_IMAGE_REF})를 ${IMAGE_REF}로 맞춥니다.${NC}"
    docker tag "${LOADED_IMAGE_REF}" "${IMAGE_REF}"
fi

IMAGE_PLATFORM="$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "${IMAGE_REF}" 2>/dev/null || true)"
if [ -z "${IMAGE_PLATFORM}" ]; then
    echo -e "${RED}❌ 로드된 이미지 플랫폼 확인 실패${NC}"
    exit 1
fi
IMAGE_ID="$(docker image inspect --format '{{.Id}}' "${IMAGE_REF}" 2>/dev/null || true)"
IMAGE_CREATED="$(docker image inspect --format '{{.Created}}' "${IMAGE_REF}" 2>/dev/null || true)"
SERVER_PLATFORM="$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}' 2>/dev/null || true)"
RUN_PLATFORM="${REQUESTED_PLATFORM:-${IMAGE_PLATFORM}}"

echo -e "${GREEN}3/5: 플랫폼 확인${NC}"
echo -e "${BLUE}- 이미지 플랫폼: ${IMAGE_PLATFORM}${NC}"
echo -e "${BLUE}- 이미지 ID: ${IMAGE_ID}${NC}"
echo -e "${BLUE}- 이미지 생성시각(UTC): ${IMAGE_CREATED}${NC}"
[ -n "${SERVER_PLATFORM}" ] && echo -e "${BLUE}- 서버 플랫폼: ${SERVER_PLATFORM}${NC}"
echo -e "${BLUE}- 실행 플랫폼: ${RUN_PLATFORM}${NC}"

if [ "${RUN_PLATFORM}" != "${IMAGE_PLATFORM}" ]; then
    echo -e "${YELLOW}⚠️ 실행 플랫폼과 이미지 플랫폼이 다릅니다.${NC}"
fi
if [ -n "${SERVER_PLATFORM}" ] && [ "${SERVER_PLATFORM}" != "${IMAGE_PLATFORM}" ]; then
    echo -e "${YELLOW}⚠️ 서버/이미지 플랫폼이 다릅니다. 에뮬레이션이 비활성화된 환경에선 실행 실패할 수 있습니다.${NC}"
fi

echo -e "${GREEN}4/5: 컨테이너 시작 중...${NC}"
RUN_OUTPUT="$(
  docker run -d \
    --name "${CONTAINER_NAME}" \
    --platform "${RUN_PLATFORM}" \
    -p "${PORT}:${PORT}" \
    -e NODE_ENV=production \
    -e PORT="${PORT}" \
    --restart unless-stopped \
    "${IMAGE_REF}" 2>&1
)" || {
  echo -e "${RED}❌ 컨테이너 시작 실패${NC}"
  echo -e "${YELLOW}docker run 오류:${NC}"
  echo "${RUN_OUTPUT}"
  echo
  echo -e "${YELLOW}점검 명령:${NC}"
  echo -e "${BLUE}- docker ps -a --filter \"name=^/${CONTAINER_NAME}$\"${NC}"
  echo -e "${BLUE}- docker logs ${CONTAINER_NAME}${NC}"
  echo -e "${BLUE}- docker image inspect --format '{{.Os}}/{{.Architecture}}' ${IMAGE_REF}${NC}"
  echo -e "${BLUE}- docker version --format '{{.Server.Os}}/{{.Server.Arch}}'${NC}"
  echo
  echo -e "${YELLOW}플랫폼 mismatch 가능성이 있습니다. tar를 다시 생성해보세요:${NC}"
  echo -e "${YELLOW}- ./create-tar.sh linux/amd64${NC}"
  echo -e "${YELLOW}- 또는 ./create-tar.sh linux/arm64${NC}"
  exit 1
}
echo -e "${BLUE}컨테이너 ID: ${RUN_OUTPUT}${NC}"

echo -e "${GREEN}5/5: 컨테이너 상태 확인 중...${NC}"
sleep 2
if docker ps --filter "name=^/${CONTAINER_NAME}$" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}✅ 배포 성공!${NC}"
    echo -e "${GREEN}🌐 접속 URL: http://localhost:${PORT}${NC}"
else
    echo -e "${RED}❌ 컨테이너 시작 실패${NC}"
    docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format '{{.Names}} {{.Status}}' || true
    docker logs "${CONTAINER_NAME}" 2>/dev/null || true
    echo -e "${YELLOW}로그 확인: docker logs ${CONTAINER_NAME}${NC}"
    exit 1
fi
