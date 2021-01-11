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

Run our container (use `sudo` if you are not in `docker` group):

```sh
PORT=80
docker run --name pikne-zadania -dp $PORT:8000 nircek/pikne-zadania
# or if you want to run it at the boot
docker run --name pikne-zadania -dp $PORT:8000 --restart unless-stopped nircek/pikne-zadania
```

Perform updates automatically with the [Watchtower](https://github.com/containrrr/watchtower):

```sh
docker run --name watchtower -dv /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower
```
