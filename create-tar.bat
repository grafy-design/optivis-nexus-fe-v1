@echo off
setlocal ENABLEDELAYEDEXPANSION

set "IMAGE_NAME=optivis-nexus-fe"
set "IMAGE_TAG=latest"
set "IMAGE_REF=%IMAGE_NAME%:%IMAGE_TAG%"

set "TARGET_PLATFORM=%~1"
if "%TARGET_PLATFORM%"=="" set "TARGET_PLATFORM=linux/amd64"

echo [INFO] Create image tar: %IMAGE_REF%
echo [INFO] Target platform: %TARGET_PLATFORM%

docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker daemon is not running.
  exit /b 1
)

set "DOCKER_DEFAULT_PLATFORM=%TARGET_PLATFORM%"

echo [1/3] Build image...
docker build --no-cache --platform %TARGET_PLATFORM% -t %IMAGE_REF% .
if errorlevel 1 (
  echo [ERROR] Docker build failed.
  exit /b 1
)

for /f "delims=" %%A in ('docker image inspect --format "{{.Os}}/{{.Architecture}}" %IMAGE_REF% 2^>nul') do set "IMAGE_PLATFORM=%%A"
if not defined IMAGE_PLATFORM (
  echo [ERROR] Could not inspect built image platform.
  exit /b 1
)

if /I not "%IMAGE_PLATFORM%"=="%TARGET_PLATFORM%" (
  echo [WARN] Built image platform is %IMAGE_PLATFORM% (requested %TARGET_PLATFORM%).
)

for /f %%A in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TIMESTAMP=%%A"
if not defined TIMESTAMP (
  set "TIMESTAMP=%DATE%_%TIME%"
  set "TIMESTAMP=%TIMESTAMP: =0%"
  set "TIMESTAMP=%TIMESTAMP:/=%"
  set "TIMESTAMP=%TIMESTAMP::=%"
)

set "TAR_FILE=%IMAGE_NAME%_%TIMESTAMP%.tar"

echo [2/3] Save tar...
docker save -o "%TAR_FILE%" %IMAGE_REF%
if errorlevel 1 (
  echo [ERROR] Docker save failed.
  exit /b 1
)

for %%A in ("%TAR_FILE%") do set "FILE_SIZE_BYTES=%%~zA"

echo [3/3] Done.
echo [OK] File: %TAR_FILE%
echo [OK] Size(bytes): %FILE_SIZE_BYTES%
echo [NEXT] Transfer the tar and run load.bat or load.sh on target host.
