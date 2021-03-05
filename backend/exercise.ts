import { JSONType, YAMLType } from "./types.ts";
export default abstract class Exercise {
  public abstract readonly type: string; // EqEx
  constructor(
    readonly name: string, // Pociągi dwa 2
    _content: string, // pociągi-dwa
    readonly properties: { [key: string]: JSONType }, // tags: kinematyka
  ) {}
  abstract render(seed: number): YAMLType; // GET
  abstract check(seed: number, answer: JSONType): JSONType; // POST
}
