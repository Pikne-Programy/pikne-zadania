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
CMD denon run --allow-net --unstable --allow-read=/app/exercises server.ts
