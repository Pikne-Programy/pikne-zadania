export type JSONType =
  | string
  | number
  | {
    [key: string]: JSONType;
  }
  | JSONType[]
  | boolean
  | null;
export type YAMLType = JSONType;
