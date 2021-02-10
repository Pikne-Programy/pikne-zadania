FROM node:14.15-alpine3.10 as frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build -- --prod --output-path=dist

FROM hayd/alpine-deno:1.7.2
EXPOSE 8000
WORKDIR /app
RUN chown -R deno:deno /usr/local
USER deno
RUN deno install -qAf --unstable https://deno.land/x/denon/denon.ts
COPY deps.ts .
RUN deno cache --unstable deps.ts
ADD . .
RUN deno cache --unstable server.ts
COPY --from=frontend /app/dist dist
CMD denon run --allow-net --unstable --allow-read=/app server.ts
