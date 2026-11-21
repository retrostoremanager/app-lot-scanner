# Local/Podman-only image for full-stack testing -- runs Expo's own web dev server
# (Metro already binds 0.0.0.0 by default, same as it does for LAN device connections).
# Not used for the real Azure Static Web Apps deploy (that's expo export, see
# .github/workflows/deploy-web-dev.yml).
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV EXPO_PUBLIC_API_BASE_URL=http://localhost:7072/api
ENV EXPO_PUBLIC_MYSTORE_API_BASE_URL=http://localhost:7071/api
ENV EXPO_PUBLIC_MYSTORE_WEB_URL=http://localhost:5173
ENV CI=1

EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--port", "8081"]
