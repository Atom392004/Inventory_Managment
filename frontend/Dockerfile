# build stage
FROM node:18-alpine as build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --silent || npm install --silent

# Copy project files
COPY . .

# Build the project
RUN npm run build

# production stage
FROM nginx:stable-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Add nginx configuration for SPA routing
RUN echo '                                               \
server {                                                \
    listen 80;                                         \
    location / {                                       \
        root /usr/share/nginx/html;                    \
        index index.html;                              \
        try_files $uri $uri/ /index.html;              \
    }                                                  \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]