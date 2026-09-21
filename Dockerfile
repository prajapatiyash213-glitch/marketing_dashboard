# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

# Build-time configuration. Vite inlines these, so they are public by design —
# never put a secret in a VITE_ variable.
ARG VITE_AUTH_MODE=api
ARG VITE_AUTH_API_URL
ARG VITE_CURRENCY=INR
ARG VITE_LOCALE=en-IN
ARG VITE_PERSIST=true
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_CURRENCY=$VITE_CURRENCY \
    VITE_LOCALE=$VITE_LOCALE \
    VITE_PERSIST=$VITE_PERSIST

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run test && npm run build

# ---- serve ----
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/assets/*.map
EXPOSE 8080
USER nginx
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
