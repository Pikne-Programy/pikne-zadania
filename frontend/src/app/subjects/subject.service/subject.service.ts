import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
    ExerciseTreeNode,
    ServerResponseNode,
    Subject as TreeSubject
} from 'src/app/exercise-service/exercise.utils';
import { TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';

export class Subject {
    readonly isPrivate: boolean;

    constructor(public id: string) {
        this.isPrivate = Subject.checkIfPrivate(id);
    }

    getName() {
        return this.isPrivate ? this.id.substr(1) : this.id;
    }

    static checkIfPrivate(name: string): boolean {
        return name.startsWith('_');
    }

    static getSubjectName(name: string): string {
        return Subject.checkIfPrivate(name) ? name.substr(1) : name;
    }
}

export class ViewExerciseTreeNode extends ExerciseTreeNode {
    isSelected = false;
    children: ViewExerciseTreeNode[];
    parent: ViewExerciseTreeNode | null;

    constructor(
        node: ExerciseTreeNode,
        parent: ViewExerciseTreeNode | null = null
    ) {
        super(
            node.value,
            node.parent,
            node.type,
            node.description,
            node.url,
            node.done
        );
        this.children = node.children.map(
            (child) => new ViewExerciseTreeNode(child, this)
        );
        this.parent = parent;
    }
}

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    constructor(private http: HttpClient) {}

    private createSubjectList(serverResponse: string[]): Subject[] {
        const res = serverResponse.map((id) => new Subject(id));
        res.sort((a, b) => {
            const comp = a
                .getName()
                .toLocaleLowerCase()
                .localeCompare(b.getName().toLocaleLowerCase());
            if (!comp) {
                if (a.isPrivate && !b.isPrivate) return 1;
                if (!a.isPrivate && b.isPrivate) return -1;
                return 0;
            }
            return comp;
        });
        return res;
    }

    getSubjects(): Promise<Subject[]> {
        return this.http
            .get(ServerRoutes.subjectList)
            .pipe(
                switchMap((response) =>
                    Array.isArray(response) &&
                    response.every((val) => typeof val === 'string')
                        ? of(this.createSubjectList(response))
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    private createExerciseTree(
        serverResponse: ServerResponseNode
    ): ViewExerciseTreeNode | null {
        const result = TreeSubject.createSubject(serverResponse, false);
        if (!result) return null;

        return new ViewExerciseTreeNode(result);
    }

    getExerciseTree(
        subjectId: string,
        shouldHaveType: boolean = false
    ): Promise<ViewExerciseTreeNode> {
        return this.http
            .post(ServerRoutes.hierarchyGet, { subject: subjectId, raw: false })
            .pipe(
                switchMap((response) => {
                    const subject = {
                        name: subjectId,
                        children: response
                    };
                    if (
                        TreeSubject.checkSubjectValidity(
                            subject,
                            shouldHaveType
                        )
                    ) {
                        const tree = this.createExerciseTree(subject);
                        return tree
                            ? of(tree)
                            : throwError({ status: TYPE_ERROR });
                    }
                    else return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }
}
