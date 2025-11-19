FROM node:20-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/client ./client
EXPOSE 3000
CMD ["node", "dist/main.js"]
