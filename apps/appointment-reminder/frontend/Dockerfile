# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (layer cache)
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
