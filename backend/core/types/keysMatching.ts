export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? [K, T[K]] : never;
}[keyof T];
