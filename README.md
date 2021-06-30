<!--
Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>

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

Install [Docker Compose](https://docs.docker.com/compose/install/):

```sh
sudo curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

Install our app (use `sudo` if you are not in `docker` group):

```sh
curl -L https://raw.githubusercontent.com/Pikne-Programy/pikne-zadania/master/docker-compose.latest.yml --create-dirs -o pikne-zadania/docker-compose.yml
cd pikne-zadania/
printf "JWT_ALG=HS512\nJWT_KEY=$(openssl rand -base64 32)\nJWT_EXP=$((7*24*60*60))\nLOGIN_TIME=2e3\nUSER_SALT=$(openssl rand -base64 32)\nDECIMAL_POINT=false\nROOT_ENABLE=yes\nROOT_PASS=$(openssl rand -base64 32)\n" > api.env
# get exercises (see section below)
docker-compose up -d
```

Perform updates automatically with the [Watchtower](https://github.com/containrrr/watchtower):

```sh
docker run --name watchtower -dv /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower
```

## Get exercises

```sh
git clone https://github.com/Pikne-Programy/pikne-zadania-exercises.git exercises # or
git clone git@github.com:Pikne-Programy/pikne-zadania-exercises.git exercises
printf "$(stat -c "GID=%g\n" exercises)" > .env
chmod -R g+ws exercises
```

## Build

```sh
git clone --recursive https://github.com/Pikne-Programy/pikne-zadania.git # clone via HTTPS
git clone --recursive git@github.com:Pikne-Programy/pikne-zadania.git # clone via SSH
cd pikne-zadania
# get exercises (see section above)
# build and run, can be repeated on and on:
docker-compose up --build # with auto-update, denon and angular CLI running in background, port 80
docker-compose -f docker-compose.prod.yml up --build # production-like environment, port 8080
# RESET ALL DOCKER STUFF (use only if it's needed!):
docker system prune -af && docker volume prune -f
```
