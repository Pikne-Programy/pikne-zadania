# Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: AGPL-3.0-or-later

FROM denoland/deno:alpine-1.22.1
EXPOSE 8000
WORKDIR /app
USER deno
COPY deps.ts .
RUN deno cache --unstable deps.ts
ADD . .
RUN deno cache --unstable server.ts
CMD deno run --allow-net --unstable --allow-read=/app/exercises,/app/reports --allow-write=/app/exercises,/app/reports --allow-env --cached-only server.ts
