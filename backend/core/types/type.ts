export interface Type<
  // deno-lint-ignore ban-types
  T extends object = object,
  A extends unknown[] = unknown[],
> extends Function {
  new (...a: A): T;
}
export interface SameType<T> extends Function {
  new (a: T): T;
}
