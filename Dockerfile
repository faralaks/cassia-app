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

COPY --from=builder /src/dist /app
COPY --from=builder /src/docker-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html \
  && ln -s /app /usr/share/nginx/html
