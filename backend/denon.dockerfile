# Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: AGPL-3.0-or-later

FROM hayd/alpine-deno:1.7.2
EXPOSE 8000
WORKDIR /app
RUN chown -R deno:deno /usr/local
USER deno
RUN deno install -qAf --unstable https://deno.land/x/denon@2.4.7/denon.ts
COPY deps.ts .
RUN deno cache --unstable deps.ts
ADD . .
RUN deno cache --unstable server.ts
CMD denon start # see scripts.yml
