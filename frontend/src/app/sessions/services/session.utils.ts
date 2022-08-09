import {
    EqEx,
    Exercise,
    isExerciseType
} from 'src/app/exercise-service/exercises';
import { isObject } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';

//#region Exercises
export type SessionExercise = {
    type: string;
    name: string;
    subject: string;
    exerciseId: string;
    description: string;
    done: number | null;
};
export function isSessionExercises(object: any): object is SessionExercises {
    return (
        Array.isArray(object) &&
        object.every(
            (item) =>
                isObject<SessionExercise>(item, [
                    ['type', ['string']],
                    ['name', ['string']],
                    ['subject', ['string']],
                    ['exerciseId', ['string']],
                    ['description', ['string']],
                    ['done', ['number', 'null']]
                ]) && isExerciseType(item.type)
        )
    );
}
export type SessionExercises = {
    subject: string;
    exerciseId: string;
    done: number | null;
}[];
//#endregion

//#region Status
export type SessionStatus = {
    finished: boolean;
    exercises: StatusExercise[];
    report: StatusUser[];
};
export function isSessionStatus(object: any): object is SessionStatus {
    return (
        isObject<SessionStatus>(object, [
            ['finished', ['boolean']],
            ['exercises', 'array'],
            ['report', 'array']
        ]) &&
        object.exercises.every((exercise) => isStatusExercise(exercise)) &&
        object.report.every(
            (user) =>
                isStatusUser(user) &&
                user.exercises.length === object.exercises.length
        )
    );
}

export type StatusExercise = {
    subject: string;
    exerciseId: string;
};
function isStatusExercise(object: any): object is StatusExercise {
    return isObject<StatusExercise>(object, [
        ['subject', ['string']],
        ['exerciseId', ['string']]
    ]);
}

type StatusUser = {
    userId: string;
    exercises: string[];
};
function isStatusUser(object: any): object is StatusUser {
    return (
        isObject<StatusUser>(object, [
            ['userId', ['string']],
            ['exercises', 'array']
        ]) && object.exercises.every((state) => typeof state === 'string')
    );
}
//#endregion

export function mapExercise(exercise: Exercise, id: string): ViewExercise {
    return {
        id,
        type: exercise.type,
        name: exercise.name,
        desc: getExerciseDescription(exercise)
    };
}

function getExerciseDescription(exercise: Exercise): string | undefined {
    switch (exercise.type) {
        case 'EqEx':
            if (EqEx.isEqEx(exercise)) return exercise.problem.main;
            return undefined;
        default:
            return undefined;
    }
}
