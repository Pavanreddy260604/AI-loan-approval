FROM node:22-alpine

WORKDIR /workspace

# Copy root and package configurations for optimal layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/billing-service/package.json ./services/billing-service/
COPY services/data-service/package.json ./services/data-service/
COPY apps/web/package.json ./apps/web/

# Install dependencies (monorepo root)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy entire source
COPY . .

# Set working directory to the target workspace
WORKDIR /workspace/apps/web

# Command to run development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
