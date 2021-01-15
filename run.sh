#!/bin/sh
trap interrupt TERM INT
interrupt () {
  echo "Interrupting with SIGINT and waiting 5s... "
  kill $pid
  timeout 5 sh -c "while kill -0 $pid &>/dev/null; do :; done"
  exit
}

(
  deno run --allow-net --unstable --allow-read=/app server.ts &
  trap "kill -SIGINT $!; wait $!" TERM
  wait $!
) &
pid=$!
wait
