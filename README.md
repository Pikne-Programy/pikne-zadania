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
CHANNEL=stable # use latest if you want
curl -L https://raw.githubusercontent.com/Pikne-Programy/pikne-zadania/master/docker-compose.$CHANNEL.yml --create-dirs -o pikne-zadania-$CHANNEL/docker-compose.yml
cd pikne-zadania-$CHANNEL/
docker-compose up -d
```

Perform updates automatically with the [Watchtower](https://github.com/containrrr/watchtower):

```sh
docker run --name watchtower -dv /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower
```


## Build

```sh
git clone --recursive https://github.com/Pikne-Programy/pikne-zadania.git # clone via HTTPS
git clone --recursive git@github.com:Pikne-Programy/pikne-zadania.git # clone via SSH
cd pikne-zadania
# build and run; it's using denon to auto-update
docker-compose up --build
```
