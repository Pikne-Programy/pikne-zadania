export default abstract class Exercise {
  public abstract readonly type: string; // EqEx
  constructor(
    readonly name: string, // Pociągi dwa 2
    _content: string, // pociągi-dwa
    readonly properties: { [key: string]: string }, // tags: kinematyka
  ) {}
  abstract render(uid: string): string; // GET
  abstract check(uid: string, answer: string): string; // POST
}
