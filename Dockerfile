FROM node:24-alpine AS build

ARG VITE_MAX_LOCATIONS=20
ENV VITE_MAX_LOCATIONS=$VITE_MAX_LOCATIONS

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM dhi.io/nginx:1

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
