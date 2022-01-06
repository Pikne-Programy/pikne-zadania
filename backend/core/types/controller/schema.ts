import { ObjectTypeOf, SchemaObject } from "../../../deps.ts";

export type defaultSchema<S extends ValidationSchema | undefined | never> =
  S extends never | undefined ? Record<string, never> : NonNullable<S>;

export type props = keyof ValidationSchema;

export type defualt2Record<S> = S extends SchemaObject
  ? ObjectTypeOf<NonNullable<S>>
  : Record<string, never>;

export type mapSchema<S extends ValidationSchema> = {
  [P in props]: defualt2Record<S[P]>;
};

export interface ValidationSchema<
  Body extends SchemaObject | undefined = SchemaObject | undefined,
  Headers extends SchemaObject | undefined = SchemaObject | undefined,
  Query extends SchemaObject | undefined = SchemaObject | undefined,
  Params extends SchemaObject | undefined = SchemaObject | undefined,
  Cookies extends SchemaObject | undefined = SchemaObject | undefined,
> {
  body?: Body;
  headers?: Headers;
  query?: Query;
  params?: Params;
  cookies?: Cookies;
}
