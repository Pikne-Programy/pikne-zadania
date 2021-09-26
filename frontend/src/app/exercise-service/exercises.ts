/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { isObject, ObjectType } from '../helper/utils';

//#region ExerciseType
export const exerciseTypes = ['EqEx'] as const;
export type ExerciseType = typeof exerciseTypes[number];
export const exerciseTypesFull = ['EquationExercise'] as const;
export type ExerciseTypeFull = typeof exerciseTypesFull[number];
const exerciseTypeMapList: [ExerciseType | ExerciseTypeFull, ExerciseType][] = [
    ['EqEx', 'EqEx'],
    ['EquationExercise', 'EqEx']
];
const exerciseTypeMap = new Map<string, ExerciseType>(exerciseTypeMapList);
/**
 * @param replace If true (default), replaces input with corresponding ExerciseType
 */
export function isExerciseType(
    input: string,
    replace: boolean = true
): input is ExerciseType {
    const type = exerciseTypeMap.get(input);
    if (type && replace) input = type;
    return type !== undefined;
}
//#endregion

export const categorySeparator = '~';

export class Exercise {
    constructor(
        public readonly id: string,
        public readonly subjectId: string,
        public readonly type: ExerciseType,
        public readonly name: string,
        public readonly problem: ObjectType,
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
                ['problem', ['object']],
                ['done', ['number', 'null', 'undefined']]
            ]) && isExerciseType(object.type)
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

//#region EqEx
type EqExContentType = {
    main: string;
    img?: string[];
    unknown: [string, string][];
};
type EqExAnswer = boolean[];
export class EqEx extends Exercise {
    problem: EqExContentType;

    protected constructor(
        id: string,
        subjectId: string,
        type: ExerciseType,
        name: string,
        problem: EqExContentType,
        done?: number | null
    ) {
        super(id, subjectId, type, name, problem, done);
        this.problem = problem;
    }

    static getAnswerObject(answers: (number | null)[]) {
        return { answers };
    }

    static isEqEx(exercise: Exercise): exercise is EqEx {
        return (
            isObject<EqExContentType>(exercise.problem, [
                ['main', ['string']],
                ['img', 'array|undefined'],
                ['unknown', 'array']
            ]) &&
            (exercise.problem.img?.every((url) => typeof url === 'string') ??
                true) &&
            exercise.problem.unknown.every(
                (pair) =>
                    Array.isArray(pair) &&
                    pair.length === 2 &&
                    typeof pair[0] === 'string' &&
                    typeof pair[1] === 'string'
            )
        );
    }

    static isEqExAnswer: (object: any, length: number) => object is EqExAnswer =
        Exercise.isBoolArrayAnswer;
}
//#endregion

//#region Previews
abstract class PreviewExerciseType {
    readonly correctAnswer: ObjectType = {};

    static isPreviewExercise: (exercise: Exercise) => boolean;
}

export class PreviewExercise extends Exercise implements PreviewExerciseType {
    readonly correctAnswer: ObjectType = {};

    static isPreviewExercise(exercise: Exercise): exercise is PreviewExercise {
        return isObject<PreviewExercise>(exercise, [
            ['correctAnswer', ['object']]
        ]);
    }
}

//#region EqEx
type CorrectEqExAnswersType = {
    answers: number[];
};
export class PreviewEqEx extends EqEx implements PreviewExerciseType {
    protected constructor(
        id: string,
        subjectId: string,
        type: ExerciseType,
        name: string,
        problem: EqExContentType,
        public readonly correctAnswer: CorrectEqExAnswersType,
        done?: number | null
    ) {
        super(id, subjectId, type, name, problem, done);
    }

    static isPreviewExercise(exercise: Exercise): exercise is PreviewEqEx {
        return (
            isObject<PreviewEqEx>(exercise, [['correctAnswer', ['object']]]) &&
            isObject<CorrectEqExAnswersType>(exercise.correctAnswer, [
                ['answers', 'array']
            ]) &&
            exercise.correctAnswer.answers.every(
                (val) => typeof val === 'number'
            )
        );
    }
}
//#endregion
//#endregion
