# Multi-stage build for React app
FROM node:20-alpine as build

WORKDIR /app
ARG REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING
ENV REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING=$REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
USER root
RUN apk add --no-cache curl && chown -R nginx:nginx /usr/share/nginx/html /etc/nginx /var/cache/nginx /var/run
USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
