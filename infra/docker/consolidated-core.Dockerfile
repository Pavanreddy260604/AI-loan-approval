# Consolidated Core Services Dockerfile
# Merges: gateway + auth + data + analytics + notification

FROM node:20-alpine

WORKDIR /app

# Copy shared packages
COPY packages/shared-config packages/shared-config
COPY packages/shared-contracts packages/shared-contracts

# Copy services
COPY services/gateway-service services/gateway-service
COPY services/auth-service services/auth-service
COPY services/data-service services/data-service
COPY services/analytics-service services/analytics-service
COPY services/notification-service services/notification-service

# Install dependencies and build all
RUN npm install -g pnpm

# Install deps for each workspace
RUN cd packages/shared-config && pnpm install && pnpm build
RUN cd packages/shared-contracts && pnpm install && pnpm build

# Install service deps
RUN cd services/gateway-service && pnpm install
RUN cd services/auth-service && pnpm install
RUN cd services/data-service && pnpm install
RUN cd services/analytics-service && pnpm install
RUN cd services/notification-service && pnpm install

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/services/auth-service && pnpm start &' >> /app/start.sh && \
    echo 'cd /app/services/data-service && pnpm start &' >> /app/start.sh && \
    echo 'cd /app/services/analytics-service && pnpm start &' >> /app/start.sh && \
    echo 'cd /app/services/notification-service && pnpm start &' >> /app/start.sh && \
    echo 'sleep 5 && cd /app/services/gateway-service && pnpm start' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 4000 4001 4003 4005 4006

CMD ["/app/start.sh"]
