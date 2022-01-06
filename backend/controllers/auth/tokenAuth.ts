import { RouterContext } from "../../deps.ts";
import { Controller } from "../../core/controller.ts";
import { User } from "../../models/mod.ts";
import { JWTService } from "../../services/mod.ts";
import { Injectable } from "../../core/ioc/mod.ts";
import {
  AuthOptions2User,
  IAuthOptions,
} from "../../core/types/controller/mod.ts";

@Injectable()
export class TokenAuthController extends Controller<User> {
  constructor(private jwtService: JWTService) {
    super();
  }
  async auth<A extends IAuthOptions>(ctx: RouterContext, options: A) {
    const isRequired = typeof options === "object"
      ? !options.isOptional
      : options;

    const jwt = ctx.cookies.get("token");

    try {
      return (await this.jwtService.resolve(jwt)) as AuthOptions2User<A, User>;
    } catch (error) {
      ctx.cookies.delete("token");

      if (isRequired) {
        throw error;
      } else {
        return undefined as AuthOptions2User<A, User>;
      }
    }
  }
}
