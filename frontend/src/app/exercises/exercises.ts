import { EventEmitter } from '@angular/core';

export enum ExerciseType {
  EqEx,
}

export const categorySeparator = '~';
export const categoryRegex = new RegExp(`([^\\${categorySeparator}]+)`, 'g');

export class Exercise {
  constructor(public type: string, public name: string, public content: any) {}

  static isExercise(object: any): object is Exercise {
    return 'type' in object && 'name' in object && 'content' in object;
  }

  static isEqExAnswer = Exercise.isBoolArrayAnswer;

  private static isBoolArrayAnswer(
    object: any,
    length: number
  ): object is boolean[] {
    return (
      Array.isArray(object) &&
      object.length === length &&
      object.every((val) => typeof val === 'boolean')
    );
  }
}

export interface ExerciseComponent {
  loaded: EventEmitter<string>;
  data?: any;
  subject?: string;
  exerciseId?: string;
  onAnswers: EventEmitter<number | null>;
  submitAnswers(): void;
}
