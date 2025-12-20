FROM node:20-alpine

WORKDIR /app

# 1. Install Dependencies (Shared Layer)
# Since both use the same package.json, this layer is cached for BOTH services.
# It only rebuilds if you add a new npm package.
COPY package*.json ./
RUN npm ci --omit=dev

# 2. The Isolation Layer
# We pass the folder name (e.g., "bot" or "server") as a variable.
ARG SERVICE_NAME

# We copy ONLY that specific folder.
# If you change files in src/bot, the src/server build cache remains VALID.
COPY src/${SERVICE_NAME} ./src/${SERVICE_NAME}

# (Optional) If you have a 'shared' folder for DB models, uncomment this:
# COPY src/shared ./src/shared

# We don't set CMD here; we do it in Docker Compose for flexibility.