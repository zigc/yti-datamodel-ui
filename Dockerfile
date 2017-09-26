# alpine version should match the version in .nvmrc as closely as possible
FROM node:6.11-alpine

ARG API_ENDPOINT
ARG NODE_ENV
ARG GIT_DATE
ARG GIT_HASH

ENV API_ENDPOINT ${API_ENDPOINT}
ENV NODE_ENV ${NODE_ENV}
ENV GIT_DATE ${GIT_DATE}
ENV GIT_HASH ${GIT_HASH}

# Install nginx
RUN apk add --update nginx && \
    rm -rf /var/cache/apk/*
RUN mkdir -p /run/nginx

# Install python
RUN apk add --update python && \
    rm -rf /var/cache/apk/*

# Install build tools
RUN apk add --update build-base && \
    rm -rf /var/cache/apk/*

# Stream the nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Add nginx config
ADD nginx.conf /etc/nginx/nginx.conf

# Install yarn
RUN ["npm", "install", "-g", "yarn"]

# Use changes to package.json to force Docker not to use the cache
# when we change our application's dependencies:
ADD package.json /tmp/package.json
ADD yarn.lock /tmp/yarn.lock
ADD types /tmp/types
WORKDIR /tmp
RUN ["yarn", "install"]

# Add the project files (works with .dockerignore to exclude node_modules, dist)
ADD . /app

# Copy possibly cached node_modules to app dir
RUN ["cp", "-a", "/tmp/node_modules", "/app/"]

# Build the dist dir containing the static files
WORKDIR /app
RUN ["npm", "run", "build"]

# Start web server and expose http
EXPOSE 80
CMD ["nginx"]
