export type JSONType =
  | string
  | number
  | {
    [key: string]: JSONType;
  }
  | JSONType[]
  | boolean
  | null;
// export type YAMLType = JSONType;
export type IdPartial<T extends { id: unknown }> = Partial<T> & Pick<T, "id">;
