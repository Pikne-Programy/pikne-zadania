import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { ServerResponseNode } from 'src/app/exercise-service/exercise.utils';
import * as ServerRoutes from 'src/app/server-routes';
import { isObject, replaceAccents, TYPE_ERROR } from 'src/app/helper/utils';
import {
    Exercise as RenderedExercise,
    exerciseTypes,
    PreviewExercise
} from 'src/app/exercise-service/exercises';

export class Exercise {
    constructor(
        public type: string = '',
        public name: string = '',
        //TODO Images
        public content: string = ''
    ) {}

    static createInstance(serverResponse: string): Exercise {
        const header = this.getHeader(serverResponse);
        const type = this.getType(header);
        const name = this.getName(header);
        const content = this.getContent(serverResponse, header);
        return new Exercise(type, name, content);
    }

    private static getHeader(input: string): string {
        const regex = /^(---\ntype: .+?\nname: .+?\n---)\n/g;
        const match = regex.exec(input);
        if (!match || match.length < 2)
            throw new Error('Wrong exercise header');

        return match[1];
    }

    private static getType(header: string): string {
        const regex = /type: (.+)\nname/g;
        const match = regex.exec(header);
        if (!match || match.length < 2)
            throw new Error('Exercise type not found');

        return match[1];
    }

    private static getName(header: string): string {
        const regex = /name: (.+)\n---/g;
        const match = regex.exec(header);
        if (!match || match.length < 2)
            throw new Error('Exercise name not found');

        return match[1];
    }

    private static getContent(input: string, header: string): string {
        return input.substring(header.length + 1);
    }

    toString(): string {
        const type =
            exerciseTypes.find(
                (value: string) =>
                    value.toUpperCase() === this.type.toLocaleUpperCase()
            ) ?? this.type;
        return `---\ntype: ${type}\nname: ${this.name}\n---\n${this.content}`;
    }

    generateId(): string {
        return Exercise.generateId(this.name);
    }

    static generateId(str: string): string {
        return encodeURIComponent(
            replaceAccents(str.toLocaleLowerCase()).replace(/\s/g, '-')
        );
    }
}

type ExerciseListType = {
    exercises: string[];
};

@Injectable({
    providedIn: 'root'
})
export class ExerciseModificationService {
    constructor(private http: HttpClient) {}

    private extractExercises(tree: ServerResponseNode): string[] {
        if (!Array.isArray(tree.children)) return [tree.children];

        const result: string[] = [];
        tree.children.forEach((node) => {
            const children = this.extractExercises(node);
            for (const exercise of children) result.push(exercise);
        });
        return result;
    }

    getAllExercises(subjectId: string): Promise<Set<string>> {
        return this.http
            .post(ServerRoutes.subjectExerciseList, { subject: subjectId })
            .pipe(
                switchMap((response) =>
                    isObject<ExerciseListType>(response, [
                        ['exercises', 'array']
                    ]) &&
                    response.exercises.every((id) => typeof id === 'string')
                        ? of(new Set(response.exercises))
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    getExercise(subjectId: string, exerciseId: string): Promise<Exercise> {
        return this.http
            .post(ServerRoutes.subjectExerciseGet, {
                subject: subjectId,
                exerciseId
            })
            .pipe(
                switchMap((response) => {
                    if (
                        isObject<{ content: string }>(response, [
                            ['content', ['string']]
                        ])
                    ) {
                        try {
                            const exercise = Exercise.createInstance(
                                response.content
                            );
                            return of(exercise);
                        }
                        catch (error) {
                            console.error(error);
                            return throwError({ status: TYPE_ERROR });
                        }
                    }
                    else return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }

    addExercise(subjectId: string, content: Exercise) {
        const exerciseId = content.generateId();
        return this.sendExercise(true, subjectId, exerciseId, content);
    }

    updateExercise(subjectId: string, exerciseId: string, content: Exercise) {
        return this.sendExercise(false, subjectId, exerciseId, content);
    }

    private sendExercise(
        isCreation: boolean,
        subjectId: string,
        exerciseId: string,
        content: Exercise
    ) {
        return this.http
            .post(
                isCreation
                    ? ServerRoutes.subjectExerciseAdd
                    : ServerRoutes.subjectExerciseUpdate,
                {
                    subject: subjectId,
                    exerciseId,
                    content: content.toString()
                }
            )
            .toPromise();
    }

    getExercisePreview(content: Exercise, seed?: number) {
        return this.http
            .post(ServerRoutes.subjectExercisePreview, {
                content: content.toString(),
                seed
            })
            .pipe(
                switchMap((response) =>
                    RenderedExercise.isExercise(response, '', '') &&
                    PreviewExercise.isPreviewExercise(response)
                        ? of(response)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }
}
