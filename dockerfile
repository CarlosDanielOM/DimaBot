FROM node:20-alpine

# ---------------------------------------------------------------------
# 1. Install System Dependencies (Added Step)
# We do this FIRST so it is cached efficiently.
# - python3 & py3-pip: Required to run twitch-dl
# - ffmpeg: Required by twitch-dl to merge video segments
# ---------------------------------------------------------------------
RUN apk add --no-cache python3 py3-pip ffmpeg

# ---------------------------------------------------------------------
# 2. Install twitch-dl (Pinned Version)
# We pin version 3.3.0 for SaaS stability.
# --break-system-packages is safe here because we are in a container.
# ---------------------------------------------------------------------
RUN pip3 install twitch-dl==3.3.0 --break-system-packages

WORKDIR /app

# ---------------------------------------------------------------------
# 3. Install Node Dependencies
# ---------------------------------------------------------------------
COPY package*.json ./
RUN npm ci --omit=dev

# ---------------------------------------------------------------------
# 4. Shared Code (Your Shared Layer)
# ---------------------------------------------------------------------
COPY class/ ./class/
COPY command/ ./command/
COPY config/ ./config/
COPY function/ ./function/
COPY handler/ ./handler/
COPY handler_function/ ./handler_function/
COPY middleware/ ./middleware/
COPY redemption_functions/ ./redemption_functions/
COPY schema/ ./schema/
# COPY services/ ./services/
COPY timer_functions/ ./timer_functions/
COPY util/ ./util/

# ---------------------------------------------------------------------
# 5. The Isolation Layer (Bot vs Server)
# ---------------------------------------------------------------------
ARG SERVICE_NAME

# Copy ONLY the specific folder (bot or server)
COPY src/${SERVICE_NAME} ./src/${SERVICE_NAME}