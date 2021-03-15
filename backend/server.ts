import { Application, HttpError, send, Status } from "./deps.ts";
import router from "./router.ts";

interface State {
  seed: number;
}

const app = new Application<State>();

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
      console.trace(e.message, e.stack);
    } else {
      context.response.status = 500;
      console.trace("UNDEFINED ERROR:", e);
    }
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
  console.log("Server started");
});

await app.listen({ port: 8000 });
