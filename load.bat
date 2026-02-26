@echo off
setlocal ENABLEDELAYEDEXPANSION

set "IMAGE_REF=optivis-nexus-fe:latest"
set "CONTAINER_NAME=optivis-nexus-fe"
set "PORT=3006"

set "TAR_FILE=%~1"
set "REQUESTED_PLATFORM=%~2"

if "%TAR_FILE%"=="" (
  for /f "delims=" %%F in ('dir /b /o:-d "optivis-nexus-fe_*.tar" 2^>nul') do (
    set "TAR_FILE=%%F"
    goto :TAR_FOUND
  )
)

:TAR_FOUND
if not defined TAR_FILE (
  echo [ERROR] No tar file found (optivis-nexus-fe_*.tar).
  exit /b 1
)

if not exist "%TAR_FILE%" (
  echo [ERROR] Tar file not found: %TAR_FILE%
  exit /b 1
)

echo [INFO] Deploy from: %TAR_FILE%

docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker daemon is not running.
  exit /b 1
)

echo [1/5] Stop existing container...
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1

echo [2/5] Load image...
docker load -i "%TAR_FILE%"
if errorlevel 1 (
  echo [ERROR] docker load failed.
  exit /b 1
)

for /f "delims=" %%A in ('docker image inspect --format "{{.Os}}/{{.Architecture}}" %IMAGE_REF% 2^>nul') do set "IMAGE_PLATFORM=%%A"
if not defined IMAGE_PLATFORM (
  echo [ERROR] Could not inspect loaded image platform.
  exit /b 1
)

for /f "delims=" %%A in ('docker version --format "{{.Server.Os}}/{{.Server.Arch}}" 2^>nul') do set "SERVER_PLATFORM=%%A"

if defined REQUESTED_PLATFORM (
  set "RUN_PLATFORM=%REQUESTED_PLATFORM%"
) else (
  set "RUN_PLATFORM=%IMAGE_PLATFORM%"
)

echo [3/5] Image platform: %IMAGE_PLATFORM%
if defined SERVER_PLATFORM echo [3/5] Docker server platform: %SERVER_PLATFORM%
echo [3/5] Run platform: %RUN_PLATFORM%

if /I not "%RUN_PLATFORM%"=="%IMAGE_PLATFORM%" (
  echo [WARN] Run platform differs from image platform.
)

if defined SERVER_PLATFORM (
  if /I not "%SERVER_PLATFORM%"=="%IMAGE_PLATFORM%" (
    echo [WARN] Server and image platform differ.
    echo [WARN] If run fails, rebuild tar with: create-tar.bat linux/amd64
  )
)

echo [4/5] Start container...
docker run -d ^
  --name %CONTAINER_NAME% ^
  --platform %RUN_PLATFORM% ^
  -p %PORT%:%PORT% ^
  -e NODE_ENV=production ^
  -e PORT=%PORT% ^
  --restart unless-stopped ^
  %IMAGE_REF%

if errorlevel 1 (
  echo [ERROR] Container start failed.
  echo [HINT] Platform mismatch is likely. Rebuild with: create-tar.bat linux/amd64
  exit /b 1
)

echo [5/5] Verify status...
timeout /t 2 /nobreak >nul
docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo [OK] Deployment complete: http://localhost:%PORT%
