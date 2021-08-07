import { EventEmitter } from '@angular/core';
import { isObject } from '../helper/utils';

export const exerciseTypes = ['EqEx'] as const;
export type ExerciseType = typeof exerciseTypes[number];

export const categorySeparator = '~';
export const categoryRegex = new RegExp(`([^\\${categorySeparator}]+)`, 'g');

export class Exercise {
  constructor(
    public readonly type: ExerciseType,
    public readonly name: string,
    public readonly content: any,
    public done?: number | null
  ) {}

  static isExercise(object: any): object is Exercise {
    return (
      isObject<Exercise>(object, [
        ['type', ['string']],
        ['name', ['string']],
        ['content', 'any'],
        ['done', ['number', 'null', 'undefined']],
      ]) && exerciseTypes.findIndex((type) => object.type === type) !== -1
    );
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

  static getDone(exercise: Exercise, subject: string) {
    if (exercise.done === undefined) {
      const localDone = localStorage.getItem(`${subject}/${exercise.name}`);
      exercise.done = localDone !== null ? Number(localDone) : undefined;
    }
  }

  static setDone(
    type: ExerciseType,
    name: string,
    subject: string,
    answers: any
  ) {
    switch (type) {
      case 'EqEx':
        const correct = (answers as boolean[]).filter((val) => val);
        localStorage.setItem(
          `${subject}/${name}`,
          (correct.length / (answers as boolean[]).length).toFixed(2).toString()
        );
        break;
    }
  }
}

export interface ExerciseComponent {
  loaded: EventEmitter<string>;
  data?: any;
  subject?: string;
  exerciseId?: string;
  onAnswers: EventEmitter<number | null>;
  submitAnswers(): void;
  setLocalDone(name: string, answers: any): void;
}
