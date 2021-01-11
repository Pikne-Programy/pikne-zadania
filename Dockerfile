FROM hayd/alpine-deno:1.6.2
EXPOSE 8000
WORKDIR /app
USER deno
COPY deps.ts .
RUN deno cache deps.ts
ADD . .
RUN deno cache server.ts # --unstable?
CMD ["./run.sh"]
