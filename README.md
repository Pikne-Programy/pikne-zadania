<!--
Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
Copyright 2022 Marcin Wykpis <marwyk2003@gmail.com>

SPDX-License-Identifier: CC-BY-4.0
-->

# Pikne Zadania

## Installation

[Install Docker](https://docs.docker.com/engine/install/) if it's not installed. If you are on Unix-based distro, you can try:

```sh
# use the docker/docker-install script when you are lazy
curl -fsSL https://get.docker.com | sh
```

and don't forget to start `docker` service (with `service` or `systemctl`):

```sh
# start the docker service if it's not started
sudo service docker start
# enable it if you want to run docker at the boot
sudo service docker enable
```

Install our app (use `sudo` if you are not in `docker` group):

```sh
curl -L https://raw.githubusercontent.com/Pikne-Programy/pikne-zadania/master/docker-compose.latest.yml --create-dirs -o pikne-zadania/docker-compose.yml
cd pikne-zadania/
printf "JWT_ALG=HS512\nJWT_KEY=$(openssl rand -base64 32)\nJWT_EXP=$((7*24*60*60))\nLOGIN_TIME=2e3\nUSER_SALT=$(openssl rand -base64 32)\nDECIMAL_POINT=false\nROOT_ENABLE=yes\nROOT_PASS=$(openssl rand -base64 32)\n" > api.env
# get exercises (see section below)
docker compose up -d
```

Perform updates automatically with the [Watchtower](https://github.com/containrrr/watchtower):

```sh
docker run --name watchtower -dv /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower
```

## Set up exercises and reports

```sh
git clone https://github.com/Pikne-Programy/pikne-zadania-exercises.git exercises # or
git clone git@github.com:Pikne-Programy/pikne-zadania-exercises.git exercises
mkdir reports

[ "$(stat -c "%g" exercises)" != "$(stat -c "%g" reports)" ] && echo 'GID of `exercises` and `reports` directories differ.'
chmod -R g+ws exercises reports
printf "$(stat -c "GID=%g\n" exercises)" > .env
```

## Build

```sh
git clone --recursive https://github.com/Pikne-Programy/pikne-zadania.git # clone via HTTPS
git clone --recursive git@github.com:Pikne-Programy/pikne-zadania.git # clone via SSH
cd pikne-zadania
# get exercises (see section above)
# build and run, can be repeated on and on:
BUILDKIT_PROGRESS=plain docker compose up --build # with auto-update, denon and angular CLI running in background, port 80
BUILDKIT_PROGRESS=plain docker compose -f docker-compose.prod.yml up --build # production-like environment, port 8080
```

## Local testing

### Frontend

Add the code below to the `web` service section in the `docker-compose.yml` file if you want to interact with the karma server.

```yml
ports:
  - 9876:9876
```

And then:

```sh
# build (see section above)
docker compose up -d
docker compose exec web /bin/sh -c "[ ! -e /tmp/firefox/firefox-bin ] && ( cd /tmp && wget https://ftp.mozilla.org/pub/firefox/releases/91.0/linux-x86_64/en-US/firefox-91.0.tar.bz2 && tar xjf firefox-91.0.tar.bz2 && chmod +x firefox/firefox-bin && apt update && apt install libgtk-3-0 libdbus-glib-1-2; )"
docker compose exec web /bin/sh -c "FIREFOX_BIN=/tmp/firefox/firefox-bin npm test -- --watch"
docker compose down
git restore docker-compose.yml
```

Additionally, you can lint the frontend code:

```sh
docker compose exec web npm run lint
```

### Backend

```sh
# build (see section above)
docker compose up -d
docker compose exec api deno test -A --unstable --cached-only --watch
docker compose down
```

Additionally, you can lint and check formatting of the backend code:

```sh
docker compose exec api deno lint --unstable
docker compose exec api deno fmt --unstable --check
```

## RESET ALL DOCKER STUFF (use only if it's needed!):

```sh
docker system prune -af && docker volume prune -f
```
