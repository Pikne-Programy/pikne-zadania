export type IAuthOptions = undefined | boolean | "optional";
/**
 * undefined->false
 *
 * true -> U
 * 'optional' -> U | G
 * false -> G
 */
export type AuthOptions2User<O extends IAuthOptions, U, G> = O extends true ? U
  : O extends "optional" ? U | G
  : G;
