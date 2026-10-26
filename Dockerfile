# Builds the site with `pnpm build` into dist/, then serves the static output
# with nginx. Same image as docket's.
FROM node:24-alpine AS build
RUN npm install --global pnpm@12.14.0
WORKDIR /site
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
