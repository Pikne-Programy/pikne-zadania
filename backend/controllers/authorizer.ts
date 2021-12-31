import { RouterContext } from "../deps.ts";
import { User } from "../models/mod.ts";
import { JWTService } from "../services/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

//FIXME move to controller
@Injectable()
export class Authorizer {
  constructor(private jwtService: JWTService) {}

  async auth(ctx: RouterContext): Promise<User>;
  async auth(ctx: RouterContext, req: true): Promise<User>;
  async auth(ctx: RouterContext, req: false): Promise<User | undefined>;
  async auth(ctx: RouterContext, req = true) {
    const jwt = ctx.cookies.get("token");

    try {
      return await this.jwtService.resolve(jwt);
    } catch (error) {
      ctx.cookies.delete("token");

      if (req) {
        throw error;
      } else {
        return;
      }
    }
  }
}
