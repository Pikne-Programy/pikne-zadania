export abstract class Exercise {
  type: string; // EqEx
  name: string; // Pociągi dwa 2
  properties: Map<string, string>; // tags: kinematyka
  constructor(
    readonly id: string, // pociągi-dwa
  ) {
    this.type = "";
    this.name = "";
    this.properties = new Map<string, string>();
  }
  abstract render(uid: string): string; // GET
  abstract check(uid: string, answer: string): string; // POST
}
