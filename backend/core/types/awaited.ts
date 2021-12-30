export type Awaited<T> = T extends PromiseLike<infer U> ? U : T; //FIXME newer typescript has it in std
