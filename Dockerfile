# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    gzip_min_length 1024;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|woff2?|ttf|eot|otf|ico|png|jpg|jpeg|gif|svg|webp)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    location /health {
        access_log off;
        default_type application/json;
        return 200 '{"status":"ok"}';
    }
}
EOF
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
