// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// img support Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { vs } from "../../deps.ts";
import { Range, RNG } from "../../utils/mod.ts";
import {
  CustomDictError,
  Exercise,
  isObject,
  JSONObject,
  JSONType,
} from "../../types/mod.ts";
import { IConfigService } from "../../interfaces/mod.ts";
import RPN from "./RPN-parser/parser.ts";

const greekAlphabet: { [key: string]: string } = {
  alpha: "\\alpha",
  Alpha: "A",
  beta: "\\beta",
  Beta: "B",
  gamma: "\\gamma",
  Gamma: "\\Gamma",
  delta: "\\delta",
  Delta: "\\Delta",
  zeta: "\\zeta",
  Zeta: "Z",
  epsilon: "\\varepsilon",
  Epsilon: "E",
  eta: "\\eta",
  Eta: "H",
  theta: "\\theta",
  Theta: "\\Theta",
  iota: "\\iota",
  Iota: "I",
  kappa: "\\kappa",
  Kappa: "K",
  lambda: "\\lambda",
  Lambda: "\\Lambda",
  mu: "\\mu",
  Mu: "N",
  nu: "\\nu",
  Nu: "N",
  xi: "\\xi",
  Xi: "\\Xi",
  omicron: "o",
  Omicron: "O",
  pi: "\\pi",
  Pi: "\\pi",
  rho: "\\rho",
  Rho: "P",
  sigma: "\\sigma",
  Sigma: "\\Sigma",
  tau: "\\tau",
  Tau: "T",
  upsilon: "\\upsilon",
  Upsilon: "\\Upsilon",
  phi: "\\varphi",
  Phi: "\\Phi",
  chi: "\\chi",
  Chi: "X",
  psi: "\\psi",
  Psi: "\\Psi",
  omega: "\\omega",
  Omega: "\\Omega",

  // polish versions
  alfa: "\\alpha",
  Alfa: "A",
  mi: "\\mu",
  Mi: "M",
  ro: "\\rho",
  Ro: "P",
  fi: "\\varphi",
  Fi: "\\Phi",
};

const imgSchema = {
  t: vs.array({
    ifUndefined: [],
    toArray: true,
    each: vs.string({ strictType: true }),
  }),
};
function isAnswer(what: unknown): what is { answers: (number | null)[] } {
  return isObject(what) && Array.isArray(what?.answers) &&
    what?.answers.every((e) => typeof e === "number" || e === null);
}

export default class EquationExercise extends Exercise {
  // regular expressions used to extract and parse content
  static readonly greekR = new RegExp(Object.keys(greekAlphabet).join("|"));
  static readonly equationR = new RegExp(
    `${RPN.variableR}=((?:[\\+\\-]?${RPN.trigonometryR}|${RPN.functionR}|${RPN.variableR}|${RPN.numberR}|[\\(\\)]|${RPN.operationR}\\s*)+)`,
  );
  static readonly numberEqR = new RegExp(
    `${RPN.variableR}=(${RPN.numberR})(${RPN.unitR})`,
  );
  static readonly unknownEqR = new RegExp(`${RPN.variableR}=\\?(${RPN.unitR})`);
  static readonly rangeEqR = new RegExp(
    `${RPN.variableR}=\\[(${RPN.numberR});(${RPN.numberR})(?:;(${RPN.numberR}))?\\](${RPN.unitR})`,
  );

  readonly type = "EqEx";
  readonly description: string;
  readonly parsedContent: string; // "lorem ipsum \(d=300\mathrm{km\}\) foo \(v_a=\mathrm{\frac{m}{s}}\) bar \(v_b=\frac{m}{s}\)."
  readonly ranges: [number, number][] = []; // [index in variables, index in parsedContent]
  readonly variables: [string, RPN | Range | number][] = []; // [name, object]
  readonly unknowns: string[] = []; // name
  readonly formattedUnknowns: [string, string][] = []; // [formatted name, unit]
  readonly order: number[] = []; // order of equations
  readonly answerPrecision: number; // such number x that: ans*(100-x)% <= user ans <= ans*(100-x)% returns correct answer
  readonly pointDecimalSeparator: boolean; //true: '.', false: ','
  readonly rngPrec: number;
  readonly img: string[];

  // content -> parse to latex, extract RPN, Range and number -> return parsed text
  constructor(
    protected cfg: IConfigService,
    readonly name: string,
    content: string,
    readonly properties: JSONObject,
  ) {
    super(cfg, name, content, properties);
    this.answerPrecision = this.cfg.ANSWER_PREC;
    this.pointDecimalSeparator = this.cfg.DECIMAL_POINT;
    this.rngPrec = this.cfg.RNG_PREC;
    try {
      this.img = vs.applySchemaObject(imgSchema, { t: this.properties.img }).t;
    } catch (_) {
      throw new Error("img must be an array of strings");
    }
    delete this.properties.img;
    let segment = 0; // segment 0: problem's content; segment 1: system of equations
    let globalIndex = 0; // global index (different than the index of the current line)
    let parsingContent = ""; // content without ranges ([number;number]) and unknowns (=?unit)
    let parsedLine = ""; // line without ranges ([number;number]) and unknowns (=?unit)
    content.split("\n").forEach((line: string) => {
      if (line == "") return;
      else if (line == "---") {
        segment++;
        return;
      } else if (segment == 0) {
        let m: RegExpExecArray | null;
        // --------------------------------------------------
        // considered regex: numberR (variable)(_underscore)=(value)(unit)
        parsedLine = "";
        while ((m = EquationExercise.numberEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} d= 300 km {1}
            m.index,
            m.index + m[0].length,
          ];
          const value = +m[3];
          const unit = EquationExercise.convertToLaTeX(m[4]);
          // add space next to the '=' to prevent from matching multiple times
          let sValue = value.toString();
          if (!this.pointDecimalSeparator) {
            sValue = sValue.replace(".", ",\\!");
          }
          parsedLine += `${
            line.substring(0, index[0])
          }\\(${formattedName}= ${sValue}${unit}\\)`;
          line = line.substring(index[1]); // remove this match from line
          this.variables.push([name, value]);
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: unknownEqR (variable)(_underscore)=?(unit)
        line = parsedLine;
        parsedLine = "";
        while ((m = EquationExercise.unknownEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} x =? {1}
            m.index,
            m.index + m[0].length,
          ];
          const unit = EquationExercise.convertToLaTeX(m[3]);
          parsedLine += `${line.substring(0, index[0])}\\(${formattedName}\\)`;
          line = line.substring(index[1]); // remove this match
          this.unknowns.push(name);
          this.formattedUnknowns.push([formattedName, unit]);
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: rangeEqR (variable)(_underscore)=[(min);(max);(step)](unit)
        line = parsedLine;
        parsedLine = "";
        while ((m = EquationExercise.rangeEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} v_a= [40;80;20] m/s {1}
            m.index,
            m.index + m[0].length,
          ];
          const rangeMin = +m[3];
          const rangeMax = +m[4];
          const step = m[5] == null ? undefined : +m[5]; // TODO: rework
          const unit = EquationExercise.convertToLaTeX(m[6]);
          this.variables.push([name, new Range(rangeMin, rangeMax, step)]);
          parsedLine += `${
            line.substring(0, index[0])
          }\\(${formattedName}= ${unit}\\)`;
          line = line.substring(index[1]); // remove this match
          globalIndex += 2 + index[0] + formattedName.length + 2; // "\(" + name + "= ";
          this.ranges.push([this.variables.length - 1, globalIndex]); // [index in this.variables, index in this.parsedContent]
          globalIndex += unit.length + 2; // LaTeX unit + "\)"
        }
        parsedLine += line;
        parsingContent += parsedLine + "\n";
        globalIndex += line.length + 1; // what's left + '\n'
      } else if (segment == 1) {
        const m = line.match(EquationExercise.equationR);
        if (m === null || m[0] !== line) {
          throw new Error("LINE DOESN'T MATCH PATTERN");
        }
        const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
        const rpn = new RPN(m[3]);
        this.variables.push([name, rpn]);
        this.order.push(this.variables.length - 1); // index in this.variables
      }
    });
    this.ranges.reverse(); //reverse order so it's easier to parse
    this.description = this.parsedContent = parsingContent;

    this.check(0, { answers: new Array(this.unknowns.length).fill(0) });
  }

  render(seed: number) {
    const rng = new RNG(seed, this.rngPrec);
    let parsingContent = this.parsedContent;
    for (const [index, textIndex] of this.ranges) {
      const range = this.variables[index][1];
      if (!(range instanceof Range)) throw new Error("never");
      const value = range.rand(rng);
      let sValue = value.toString();
      if (!this.pointDecimalSeparator) sValue = sValue.replace(".", ",\\!");
      parsingContent = `${parsingContent.substr(0, textIndex)}${sValue}${
        parsingContent.substr(textIndex)
      }`;
    }
    return {
      type: this.type,
      name: this.name,
      problem: {
        main: parsingContent,
        unknown: this.formattedUnknowns,
        img: this.img,
      },
    };
  }

  getCorrectAnswer(seed: number) {
    const s = this.check(seed);
    if ("correctAnswer" in s) return { answers: s.correctAnswer };
    throw new Error("never"); // TODO: refactor, make it better
  }

  check(seed: number, answer?: JSONType) {
    // TODO: use value-schema
    if (answer !== undefined && !isAnswer(answer)) {
      return new CustomDictError("ExerciseBadAnswerFormat", {
        description: "INVALID ANSWER FORMAT",
      });
    }
    const answers = answer?.answers;
    if (answers !== undefined && answers.length != this.unknowns.length) {
      return new CustomDictError("ExerciseBadAnswerFormat", {
        description: "INVALID ANSWER LENGTH",
      });
    }
    const answerDict = answers !== undefined // TODO: refactor
      ? this.unknowns.reduce(
        (a: { [key: string]: number | null }, x, i) => {
          a[x] = answers[i];
          return a;
        },
        {},
      )
      : {};
    const rng = new RNG(seed, this.rngPrec);
    const calculated: { [key: string]: number | undefined } = {};
    // add already calculated numbers to calculated variables
    for (const [name, val] of this.variables) {
      if (typeof val == "number") calculated[name] = val;
    }
    // randomize ranges (in the correct order) and add them to calculated variables
    for (const [index, _] of this.ranges) {
      const name = this.variables[index][0];
      const val = this.variables[index][1];
      if (val instanceof Range) calculated[name] = val.rand(rng);
    }
    // calculate RPN variables (in the correct order) and add them to calculated variables
    for (let i = 0; i < this.order.length; ++i) {
      const index = this.order[i];
      const name = this.variables[index][0];
      const val = this.variables[index][1];
      if (val instanceof RPN) calculated[name] = val.calculate(calculated);
    }
    // go through each unknown and compare the answers to what's calculated
    const info: boolean[] = [];
    const correctAnswer: number[] = [];
    for (const name of this.unknowns) {
      const correctAns = calculated[name];
      if (correctAns === undefined) throw new Error("UNKNOWN NOT CALCULATED"); // this should throw an error only when called in constructor
      correctAnswer.push(correctAns);
      if (answers !== undefined && !(name in answerDict)) {
        throw new Error("never");
      }
      const ans = answerDict[name];
      info.push(
        ans != null &&
          Math.abs(ans - correctAns) <= this.answerPrecision * correctAns,
      );
    }
    const done = info.reduce((a: number, b) => a + (+b), 0) / info.length;
    return { correctAnswer, done, info };
  }

  static convertToLaTeX(unit: string): string {
    if (unit == "") return "";
    let parsedUnit = "";
    let isFraction = false;
    const r = "\\^([\\-\\+]?[0-9]+)|deg|([a-zA-Z]+|[\\-\\+])|[\\*\\/\\^]";
    const execR = new RegExp(r, "g");
    const testR = new RegExp(`^(${r})+$`);
    if (!testR.test(unit)) throw new Error("INVALID UNIT FORMAT");
    let m: RegExpExecArray | null;
    while ((m = execR.exec(unit)) !== null) {
      if (m[0] == "deg") {
        parsedUnit += "°";
      } else if (m[2] !== undefined) {
        parsedUnit += m[0];
      } else if (m[1] !== undefined) {
        parsedUnit += `^{${m[1]}}`;
      } else if (m[0] === "*") {
        parsedUnit += " \\cdot ";
      } else if (m[0] === "/") {
        parsedUnit = parsedUnit === "" ? "1" : parsedUnit;
        parsedUnit = `${parsedUnit}}{`;
        isFraction = true;
      }
    }
    parsedUnit = `${parsedUnit[0] !== "°" ? "\\;" : ""}\\mathrm{${
      isFraction ? "\\frac{" : ""
    }${parsedUnit}${isFraction ? "}" : ""}}`;
    return parsedUnit;
  }
  static convertToGreek(name: string): string {
    let m: RegExpExecArray | null;
    let parsedName = "";
    while ((m = EquationExercise.greekR.exec(name)) !== null) {
      parsedName += `${name.substring(0, m.index)}${greekAlphabet[m[0]]}${
        name.substring(m.index + m[0].length)
      }`;
      name = name.substring(m.index + m[0].length); // remove this match from the string
    }
    parsedName += name;
    return parsedName;
  }
}
