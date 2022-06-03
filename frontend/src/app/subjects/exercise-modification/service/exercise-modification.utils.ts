import {
    ExerciseType,
    isExerciseType
} from 'src/app/exercise-service/exercises';
import { isObject, replaceAccents } from 'src/app/helper/utils';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type ListedExerciseType = {
    id: string;
    type: ExerciseType;
    name: string;
    description: string;
};
type ExerciseListType = {
    exercises: ListedExerciseType[];
};
export function isExerciseListType(object: any): object is ExerciseListType {
    return (
        isObject<ExerciseListType>(object, [['exercises', 'array']]) &&
        object.exercises.every(
            (exercise) =>
                isObject<ListedExerciseType>(exercise, [
                    ['id', ['string']],
                    ['type', ['string']],
                    ['name', ['string']],
                    ['description', ['string']]
                ]) && isExerciseType(exercise.type)
        )
    );
}

export class Exercise {
    constructor(
        public header: ExerciseHeader = new ExerciseHeader('', ''),
        public content: string = ''
    ) {}

    static createInstance(serverResponse: string): Exercise {
        const header = this.getHeader(serverResponse);
        const content = this.getContent(serverResponse);
        return new Exercise(header, content);
    }

    private static getHeader(input: string): ExerciseHeader {
        const regex = /---\n(.+?)---/s;
        const match = regex.exec(input);
        if (match && match.length >= 2) {
            const parsed = parseYaml(match[1]);
            if (ExerciseHeader.isExerciseHeader(parsed)) return parsed;
        }
        throw new Error('Wrong exercise header');
    }

    private static getContent(input: string): string {
        const regex = /---.+?---\n(.*)/s;
        const match = regex.exec(input);
        if (match && match.length >= 2) return match[1];
        throw new Error('Wrong exercise content');
    }

    toString(): string {
        return `---\n${stringifyYaml(JSON.parse(JSON.stringify(this.header)))}---\n${this.content}`;
    }

    generateId(): string {
        return Exercise.generateId(this.header.name);
    }

    static generateId(str: string): string {
        return encodeURIComponent(
            replaceAccents(str.toLocaleLowerCase()).replace(/\s/g, '-')
        );
    }
}

export class ExerciseHeader {
    constructor(public type: string, public name: string) {}

    static isExerciseHeader(object: any): object is ExerciseHeader {
        return isObject<ExerciseHeader>(object, [
            ['type', ['string']],
            ['name', ['string']]
        ]);
    }
}

export class EqExHeader extends ExerciseHeader {
    constructor(
        type: ExerciseType,
        name: string,
        public img?: string | string[]
    ) {
        super(type, name);
    }

    static isEqExHeader(object: ExerciseHeader): object is EqExHeader {
        return (
            (isExerciseType(object.type) &&
                isObject<EqExHeader>(object, [
                    ['img', ['string', 'undefined']]
                ])) ||
            (isObject<EqExHeader>(object, [['img', 'array|undefined']]) &&
                (object.img
                    ? (object.img as unknown[]).every(
                          (val) => typeof val === 'string'
                      )
                    : true))
        );
    }
}
