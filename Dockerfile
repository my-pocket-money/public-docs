# Builds the site with `pnpm build` into dist/, then serves the static output
# with nginx. Same image as docket's, plus bash for the contract check. Node and
# pnpm match bin/ (hermit), so the image builds what `pnpm build` builds locally.
FROM node:24-alpine AS build
# bash runs openapi/relay/scripts/build.sh.
RUN apk add --no-cache bash && npm install --global pnpm@12.14.0
WORKDIR /site
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
