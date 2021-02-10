import { EventEmitter } from '@angular/core';

export enum ExerciseType {
  EqEx,
}

export class Exercise {
  constructor(public type: string, name: string, content: any) {}
}

export function isExercise(object: any): object is Exercise {
  return 'type' in object && 'name' in object && 'content' in object;
}

export interface ExerciseComponent {
  loaded: EventEmitter<string>;
  data?: any;
  subject?: string;
  exerciseId?: string;
}
