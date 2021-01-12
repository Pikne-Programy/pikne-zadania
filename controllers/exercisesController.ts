import { Context } from "../deps.ts";
export class ExercisesController {
  constructor() {
    // TODO
    // get all Exercises from exercises/
    // construct them with exts/exts.ts
    // store them
  }
  async list(ctx: Context) {
    // TODO
    ctx.response.status = 200;
    ctx.response.body = {
      "pociągi-dwa": "Pociągi dwa 2",
    };
  }
  async get(ctx: Context) {
    // TODO
    ctx.response.status = 200;
    ctx.response.body = {
      "type": "EqEx",
      "name": "Pociągi dwa 2",
      "content": {
        "main":
          "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
        "imgs": ["1.png", "2.png"],
        "unknowns": [["x", "km"], ["t", "s"]],
      },
    };
  }

  async check(ctx: Context) {
    // TODO
    ctx.response.status = 200;
    ctx.response.body = {
      "success": false,
    };
  }
}
export default new ExercisesController();
