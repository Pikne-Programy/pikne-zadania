import { get } from "../../utils/mod.ts";

export class FailFastManager<T = undefined> {
  t: Deno.TestContext;
  ctx: T;
  ff: boolean;
  ignore = false;

  constructor(t: Deno.TestContext, ctx: T, ff?: boolean) {
    this.t = t;
    this.ctx = ctx;
    this.ff = ff ?? get("boolean", "FAIL_FAST", true);
  }

  resetIgnore() {
    this.ignore = false;
  }

  async test(
    name: string,
    fn: (t: Deno.TestContext) => Promise<void> | void,
    required = false,
  ) {
    const r = await this.t.step({ name, ignore: this.ignore, fn });
    if (this.ff && required) this.ignore ||= !r;
  }

  async testCritic(
    name: string,
    fn: (t: Deno.TestContext, ctx: T) => Promise<boolean> | boolean,
    required = false,
  ) {
    let critic = true;
    const r = await this.t.step({
      name,
      ignore: this.ignore,
      fn: async (t) => {
        critic = await fn(t, this.ctx);
      },
    });
    if (this.ff && required) this.ignore ||= critic || !r;
  }
}
