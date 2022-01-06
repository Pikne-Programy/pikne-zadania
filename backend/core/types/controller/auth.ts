export type IAuthOptions = undefined | boolean | { isOptional: boolean };

export type AuthOptions2User<O extends IAuthOptions, U> = O extends true ? U
  : O extends { isOptional: true } ? U | undefined
  : undefined;
