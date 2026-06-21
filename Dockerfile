## Builder
FROM node:24.13.1-alpine AS builder

WORKDIR /src

COPY .npmrc package.json package-lock.json /src/
RUN npm ci
COPY . /src/
ENV NODE_OPTIONS=--max_old_space_size=4096
# Version baked into the build (shown in About / login). Passed by CI from the
# git tag; defaults to 'unknown' for plain `docker build` with no --build-arg.
ARG CASSIA_VERSION=unknown
ENV CASSIA_VERSION=$CASSIA_VERSION
RUN npm run build


## App
FROM nginx:1.29.8-alpine

# jq is used by the runtime config patch script.
RUN apk add --no-cache jq

COPY --from=builder /src/dist /app
COPY --from=builder /src/docker-nginx.conf /etc/nginx/conf.d/default.conf

# The nginx base image runs every executable in /docker-entrypoint.d/ before
# starting the server, so this patches config.json from env (e.g.
# CASSIA_HOMESERVER) at container start. Numeric prefix orders it among the
# stock scripts.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-cassia-config.sh

RUN rm -rf /usr/share/nginx/html \
  && ln -s /app /usr/share/nginx/html \
  && chmod +x /docker-entrypoint.d/40-cassia-config.sh
