FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM dhi.io/nginx:1

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
