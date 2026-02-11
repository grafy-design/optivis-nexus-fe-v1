#!/bin/bash
# 로컬에서 실행: Docker 이미지 빌드 → tar 파일 생성 (Nexus FE, 포트 3006)

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "📦 Nexus FE tar 파일 생성..."

echo -e "${BLUE}1/2: Docker 이미지 빌드 중...${NC}"
docker build --no-cache -t optivis-nexus-fe:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 빌드 실패${NC}"
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TAR_FILE="optivis-nexus-fe_${TIMESTAMP}.tar"
echo -e "${BLUE}2/2: tar 파일 생성 중...${NC}"
docker save -o "${TAR_FILE}" optivis-nexus-fe:latest

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "${TAR_FILE}" | cut -f1)
    echo -e "${GREEN}✅ tar 파일 생성 완료!${NC}"
    echo -e "${GREEN}📦 파일: ${TAR_FILE}${NC}"
    echo -e "${GREEN}📊 크기: ${FILE_SIZE}${NC}"
    echo
    echo -e "${YELLOW}🚀 서버 배포:${NC}"
    echo -e "${BLUE}1. ${TAR_FILE} 를 서버로 전송${NC}"
    echo -e "${BLUE}2. 서버에서 ./load.sh 실행${NC}"
    echo -e "${BLUE}3. 접속: http://localhost:3006${NC}"
else
    echo -e "${RED}❌ tar 파일 생성 실패${NC}"
    exit 1
fi
