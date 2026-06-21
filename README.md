# Cassia

A Telegram Desktop inspired Matrix client, forked from [Cinny](https://github.com/cinnyapp/cinny).

This is a personal fork maintained for myself and a small group of friends. Most of the changes
on top of upstream Cinny were written with Claude (Anthropic's AI assistant) and have not been
fully human-reviewed — use it at your own risk, no warranty is provided.

The main goal is to have an instant messaging application that is easy on people and has a modern
touch, closer to what Telegram Desktop feels like.

Huge thanks to [Ajay Bura](https://github.com/ajbura) and the Cinny contributors for the original
project this fork is built on.

## Getting started
There is no public hosted instance — Cassia is meant to be self-hosted.
## Self-hosting
To host Cassia on your own, clone this repo and build it yourself (see Local development below), or pull/build a docker image.

* The default homeservers and explore pages are defined in [`config.json`](config.json).

* You need to set up redirects to serve the assests. Example configurations; [netlify](netlify.toml), [nginx](contrib/nginx/cinny.domain.tld.conf), [caddy](contrib/caddy/caddyfile).
    * If you have trouble configuring redirects you can [enable hash routing](config.json#L35) — the url in the browser will have a `/#/` between the domain and open channel (ie. `yourdomain.tld/#/home/` instead of `yourdomain.tld/home/`) but you won't have to configure your webserver.

* To deploy on subdirectory, you need to rebuild the app youself after updating the `base` path in [`build.config.ts`](build.config.ts).
    * For example, if you want to deploy on `https://yourdomain.tld/app`, then set `base: '/app'`.

## Local development
> [!TIP]
> We recommend using a version manager as versions change very quickly. You will likely need to switch between multiple Node.js versions based on the needs of different projects you're working on. [NVM on windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) on Windows and [nvm](https://github.com/nvm-sh/nvm) on Linux/macOS are pretty good choices. Recommended nodejs version is Krypton LTS (v24.13.1).

Execute the following commands to start a development server:
```sh
npm ci # Installs all dependencies
npm start # Serve a development version
```

To build the app:
```sh
npm run build # Compiles the app into the dist/ directory
```

### Running with Docker
This repository includes a Dockerfile, which builds the application from source and serves it with Nginx on port 80. To
use this locally, you can build the container like so:
```
docker build -t cassia:latest .
```

You can then run the container you've built with a command similar to this:
```
docker run -p 8080:80 cassia:latest
```

This will forward your `localhost` port 8080 to the container's port 80. You can visit the app in your browser by navigating to `http://localhost:8080`.
