import { Application, HttpError, send, Status } from "./deps.ts";
import router from "./router.ts";

interface State {
  seed: number;
}

const app = new Application<State>();

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${hostname ??
      "localhost"}:${port}`,
  );
});

app.addEventListener("error", (e) => {
  console.log(e.error);
});

const basicHTMLTemplate = (msg: string) =>
  `<!DOCTYPE html><html><body><h1>${msg}</h1></body></html>`;

app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      context.response.status = e.status;
      context.response.body = basicHTMLTemplate(
        `${e.status} ${e.expose ? e.message : Status[e.status]}`,
      );
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = basicHTMLTemplate("500 Internal Server Error");
      console.error(e.message, e.stack);
    }
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/frontend`,
    index: "index.html",
  });
});

app.addEventListener("listen", () => {
  console.log("Server started");
});

await app.listen({ port: 8000 });
