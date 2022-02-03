import { RouterContext } from "../../deps.ts";
import { Controller } from "../../core/controller.ts";
import { Guest, User } from "../../models/mod.ts";
import { JWTService } from "../../services/mod.ts";
import { Injectable } from "../../core/ioc/mod.ts";
import {
  AuthOptions2User,
  IAuthOptions,
} from "../../core/types/controller/mod.ts";

@Injectable()
export class TokenAuthController extends Controller<User, Guest> {
  constructor(private jwtService: JWTService) {
    super();
  }

  async auth<A extends IAuthOptions>(ctx: RouterContext, options: A) {
    const isRequired = options === true;

    const jwt = ctx.cookies.get("token");

    try {
      return (await this.jwtService.resolve(jwt)) as AuthOptions2User<
        A,
        User,
        Guest
      >;
    } catch (error) {
      ctx.cookies.delete("token");

      if (isRequired) {
        throw error;
      }

      return new Guest() as AuthOptions2User<A, User, Guest>;
    }
  }
}
