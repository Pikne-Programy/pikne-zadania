/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { isObject } from '../helper/utils';

export const exerciseTypes = ['EqEx'] as const;
export type ExerciseType = typeof exerciseTypes[number];

export const categorySeparator = '~';

export class Exercise {
    constructor(
        public readonly id: string,
        public readonly subjectId: string,
        public readonly type: ExerciseType,
        public readonly name: string,
        public readonly content: any,
        public done?: number | null
    ) {}

    static isExercise(
        object: any,
        id: string,
        subjectId: string
    ): object is Exercise {
        if (object === null || typeof object !== 'object') return false;

        object.id = id;
        object.subjectId = subjectId;
        return (
            isObject<Exercise>(object, [
                ['id', ['string']],
                ['subjectId', ['string']],
                ['type', ['string']],
                ['name', ['string']],
                ['content', 'any'],
                ['done', ['number', 'null', 'undefined']]
            ]) && exerciseTypes.findIndex((type) => object.type === type) !== -1
        );
    }

    protected static isBoolArrayAnswer(
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
            const localDone = localStorage.getItem(
                `${subject}/${exercise.name}`
            );
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
            case 'EqEx': {
                const correct = (answers as boolean[]).filter((val) => val);
                localStorage.setItem(
                    `${subject}/${name}`,
                    (correct.length / (answers as boolean[]).length)
                        .toFixed(2)
                        .toString()
                );
                break;
            }
        }
    }
}

type EqExContentType = {
    main: string;
    img?: string[];
    unknowns: [string, string][];
    correct?: number[];
};
export class EqEx extends Exercise {
    content: EqExContentType;

    constructor(
        id: string,
        subjectId: string,
        type: ExerciseType,
        name: string,
        content: any,
        done?: number | null
    ) {
        super(id, subjectId, type, name, content, done);
        this.content = content;
    }

    static isEqEx(exercise: Exercise): exercise is EqEx {
        return (
            isObject<EqExContentType>(exercise.content, [
                ['main', ['string']],
                ['img', 'array|undefined'],
                ['unknowns', 'array'],
                ['correct', 'array|undefined']
            ]) &&
            (exercise.content.img?.every((url) => typeof url === 'string') ??
                true) &&
            exercise.content.unknowns.every(
                (pair) =>
                    Array.isArray(pair) &&
                    pair.length === 2 &&
                    typeof pair[0] === 'string' &&
                    typeof pair[1] === 'string'
            ) &&
            (!exercise.content.correct ||
                exercise.content.correct.every(
                    (value) => typeof value === 'number'
                ))
        );
    }

    static isEqExAnswer = Exercise.isBoolArrayAnswer;
}
