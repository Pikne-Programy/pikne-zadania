import { ConfigService } from "./mod.ts";
import { CustomDictError } from "../types/mod.ts";

type handler = (err: unknown) => void;
export class Logger {
  /**
   * - 0 - quiet
   * - 1 - critical
   * - 2 - warning
   * - 3 - information
   * - 4 - debug
   */
  private readonly VERBOSITY!: number;
  private handlers = [
    [
      CustomDictError,
      (e: CustomDictError) => {
        console.trace(e.message, e.info, e.stack);
      },
    ],
    [
      Error,
      (e: Error) => {
        console.trace(e.message, e.stack);
      },
    ],
    [
      ErrorEvent,
      (e: ErrorEvent) => {
        console.trace("ErrorEvent:", e);
      },
    ],
  ] as const;

  constructor(config: ConfigService) {
    this.VERBOSITY = config.VERBOSITY;
  }

  private write(
    data: unknown[],
    verbosity: number,
    method: (...data: unknown[]) => void
  ) {
    if (this.VERBOSITY >= verbosity) {
      method(...data);
    }
  }

  error(...data: unknown[]): this {
    this.write(data, 1, console.error);
    return this;
  }
  warn(...data: unknown[]): this {
    this.write(data, 2, console.warn);
    return this;
  }
  log(...data: unknown[]): this {
    this.write(data, 3, console.log);
    return this;
  }
  info(...data: unknown[]): this {
    this.write(data, 3, console.info);
    return this;
  }
  trace(...data: unknown[]): this {
    this.write(data, 4, console.trace);
    return this;
  }
  debug(...data: unknown[]): this {
    this.write(data, 4, console.debug);
    return this;
  }

  recogniseAndTrace(
    e: unknown,
    {
      msg,
      customVerbosity = 1,
    }: { msg?: string; customVerbosity?: number } = {}
  ) {
    if (this.VERBOSITY < customVerbosity) {
      return;
    }

    if (msg) {
      console.error("-------", msg);
    }

    const defaultHandler = (e: unknown) => console.trace("UNKNOWN ERROR:", e);

    const handle = (this.handlers
      .filter(([errClass]) => e instanceof errClass)
      .map(([_, handler]) => handler)[0] || defaultHandler) as handler;

    handle(e);
  }
}
