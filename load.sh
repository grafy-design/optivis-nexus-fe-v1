#!/bin/bash
# 서버에서 실행: tar import → 컨테이너 실행 (Nexus FE, 포트 3006)

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Nexus FE 서버 배포..."

TAR_FILE=$(ls optivis-nexus-fe_*.tar 2>/dev/null | head -n1)
if [ -z "$TAR_FILE" ]; then
    echo -e "${RED}❌ optivis-nexus-fe_*.tar 파일을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}현재 디렉토리에 tar 파일이 있는지 확인하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}📦 발견된 tar 파일: ${TAR_FILE}${NC}"

echo -e "${GREEN}1/3: 기존 컨테이너 중지...${NC}"
docker stop optivis-nexus-fe 2>/dev/null || true
docker rm optivis-nexus-fe 2>/dev/null || true

echo -e "${GREEN}2/3: Docker 이미지 import 중...${NC}"
docker load -i "${TAR_FILE}"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 이미지 import 실패${NC}"
    exit 1
fi

echo -e "${GREEN}3/3: 컨테이너 시작 중...${NC}"
docker run -d \
  --name optivis-nexus-fe \
  -p 3006:3006 \
  -e NODE_ENV=production \
  -e PORT=3006 \
  --restart unless-stopped \
  optivis-nexus-fe:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 배포 성공!${NC}"
    echo -e "${GREEN}🌐 접속 URL: http://localhost:3006${NC}"
    sleep 3
    if docker ps | grep -q optivis-nexus-fe; then
        echo -e "${GREEN}✅ 컨테이너 정상 실행 중${NC}"
    else
        echo -e "${RED}❌ 컨테이너 시작 실패${NC}"
        echo -e "${YELLOW}로그: docker logs optivis-nexus-fe${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 배포 실패${NC}"
    exit 1
fi
echo -e "${GREEN}🎉 배포 완료!${NC}"
