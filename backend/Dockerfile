FROM hayd/alpine-deno:1.7.2
EXPOSE 8000
WORKDIR /app
USER deno
COPY deps.ts .
RUN deno cache --unstable deps.ts
ADD . .
RUN deno cache --unstable server.ts
CMD deno run --allow-net --unstable --allow-read=/app/exercises server.ts
