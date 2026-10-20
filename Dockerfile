# ---------- build ----------
FROM node:26-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:26-alpine AS runtime
WORKDIR /usr/src/app

RUN npm install -g serve@14 --no-audit --no-fund

COPY --from=build /usr/src/app/build ./dist