/** This file is based on {@link /backend/exts/eqex/equationExercise.ts} */

class RPN {
  static readonly numberR = '[0-9]*\\.?[0-9]+(?:[eE][\\-\\+]?[0-9]+)?';
  static readonly variableR = '(?<![0-9])([a-zA-Z0-9\']+)(_[a-zA-Z0-9\']+)?';
  static readonly unitR = '(?:[a-zA-Z0-9\\+\\-\\/\\*\\^]+)?';
  static readonly operationR = '[\\+\\-*\\/\\^\\-]';
  static readonly functionR = 'sqrt|abs|exp|ln|log2|log10|log';
  static readonly trigonometryR = 'a?(?:sin|cos|tan|cot|tg|ctg)h?r?';

  static createTrigList(): string[] {
      const result: string[] = [];
      const functionList: string[] = ['sin', 'cos', 'tan', 'cot'];
      for (const prefix of ['', 'a'])
          for (const func of functionList) result.push(prefix + func);
      for (const func of functionList) result.push(func + 'h');
      return result;
  }
}

const greekAlphabet = [
    'alpha',
    'Alpha',
    'beta',
    'Beta',
    'gamma',
    'Gamma',
    'delta',
    'Delta',
    'zeta',
    'Zeta',
    'epsilon',
    'Epsilon',
    'eta',
    'Eta',
    'theta',
    'Theta',
    'iota',
    'Iota',
    'kappa',
    'Kappa',
    'lambda',
    'Lambda',
    'mu',
    'Mu',
    'nu',
    'Nu',
    'xi',
    'Xi',
    'omicron',
    'Omicron',
    'pi',
    'Pi',
    'rho',
    'Rho',
    'sigma',
    'Sigma',
    'tau',
    'Tau',
    'upsilon',
    'Upsilon',
    'phi',
    'Phi',
    'chi',
    'Chi',
    'psi',
    'Psi',
    'omega',
    'Omega',

    // polish versions
    'alfa',
    'Alfa',
    'mi',
    'Mi',
    'ro',
    'Ro',
    'fi',
    'Fi'
] as const;

class EquationExercise {
  static readonly latexR = /\\\(.*?\\\)/g;
  static readonly greekR = new RegExp(greekAlphabet.join('|'), 'g');
  static readonly equationR = new RegExp(
      `(?:${RPN.variableR})=(?:[\\+\\-]?${RPN.trigonometryR}|${RPN.functionR}|${RPN.variableR}|${RPN.numberR}|[\\(\\)]|${RPN.operationR}\\s*)+`,
      'g'
  );
  static readonly numberEqR = new RegExp(
      `${RPN.variableR}=${RPN.numberR}${RPN.unitR}`,
      'g'
  );
  static readonly unknownEqR = new RegExp(
      `${RPN.variableR}=\\?${RPN.unitR}`,
      'g'
  );
  static readonly rangeEqR = new RegExp(
      `${RPN.variableR}=\\[${RPN.numberR};${RPN.numberR}(?:;${RPN.numberR})?\\]${RPN.unitR}`,
      'g'
  );
}

export type InputType = 'variable' | 'number' | 'unit';
export const INPUT_TYPES_MAP: { [key in InputType]: RegExp } = {
    variable: new RegExp(`^${RPN.variableR}$`),
    number: new RegExp(`^[\\+\\-]?${RPN.numberR}$`),
    unit: new RegExp(`^${RPN.unitR}$`)
};

//NOTE More specific searches should be lower
export const highlightList: [RegExp, string, string][] = [
    [EquationExercise.latexR, '#bca3ff', '#2b1665'],
    [EquationExercise.equationR, '#5ec85e', '#003600'],
    [EquationExercise.numberEqR, 'orange', '#542b00'],
    [EquationExercise.rangeEqR, '#ff5151', '#580000'],
    [EquationExercise.unknownEqR, '#90caf9', '#003140']
];

export const functions = RPN.functionR.split('|');
export const trigonometry = RPN.createTrigList();
export function createVariable(
    name: string,
    value: string,
    unit?: string
): string {
    return `${name}=${value}${unit ?? ''}`;
}
export function createRange(
    name: string,
    start: string,
    end: string,
    step?: string,
    unit?: string
): string {
    return `${name}=[${start};${end}${step ? `;${step}` : ''}]${unit ?? ''}`;
}
export function createUnknown(name: string, unit?: string): string {
    return `${name}=?${unit ?? ''}`;
}
