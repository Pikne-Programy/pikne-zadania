export abstract class Exercise {
  constructor(
    type: string, // EqEx
    id: string, // pociągi-dwa
    name: string, // Pociągi dwa 2
    properties: Map<string, string> // tags: kinematyka
  ){}
  abstract init(): undefined;
  abstract render(uid: string): string; // GET
  abstract check(uid: string, answer: string): string; // POST
}

