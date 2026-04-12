FROM node:22-alpine

# Set build argument for the workspace
ARG WORKSPACE
WORKDIR /workspace

# Install tsx globally and set npm path
RUN npm install -g tsx && npm cache clean --force

# Copy root and package configurations for optimal layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/data-service/package.json ./services/data-service/
COPY services/notification-service/package.json ./services/notification-service/
COPY services/analytics-service/package.json ./services/analytics-service/
COPY services/gateway-service/package.json ./services/gateway-service/
COPY apps/web/package.json ./apps/web/

# Install dependencies (monorepo root)
RUN --mount=type=cache,target=/root/.npm \
    npm install --include=dev

# Copy entire source
COPY . .

# Set working directory to the target workspace
WORKDIR /workspace/${WORKSPACE}

# Command to run development server
CMD ["npm", "run", "dev"]
