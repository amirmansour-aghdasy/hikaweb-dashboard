# Multi-stage build for Hikaweb Dashboard
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove .md files
RUN find . -name "*.md" -type f -delete

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 1281

ENV PORT=1281
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1281', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["node", "server.js"]

