import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
    ExerciseTreeNode,
    ServerResponseNode,
    Subject as TreeSubject
} from 'src/app/exercise-service/exercise.utils';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';
import { AssigneeUser } from 'src/app/user/team.service/types';

export class Subject {
    readonly isPrivate: boolean;

    constructor(public id: string) {
        this.isPrivate = Subject.checkIfPrivate(id);
    }

    getName() {
        return this.isPrivate ? this.id.substring(1) : this.id;
    }

    static checkIfPrivate(name: string): boolean {
        return name.startsWith('_');
    }

    static getSubjectName(name: string): string {
        return Subject.checkIfPrivate(name) ? name.substring(1) : name;
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

interface AssigneeItem {
    userId: string;
    name: string;
}
export interface Assignee extends AssigneeItem {
    isSelected: boolean;
}
function isAssigneeItemList(object: unknown[]): object is AssigneeItem[] {
    return object.every((item) =>
        isObject<AssigneeItem>(item, [
            ['userId', ['string']],
            ['name', ['string']]
        ])
    );
}
function mapAssignees(
    teacherList: AssigneeUser[],
    assigneeList: AssigneeItem[]
): Assignee[] {
    const assigneeSet = new Set<string>(assigneeList.map((val) => val.userId));
    return teacherList
        .map((user) => ({
            userId: user.userId,
            name: user.name,
            isSelected: assigneeSet.has(user.userId)
        }))
        .sort((user1, user2) => user1.name.localeCompare(user2.name));
}

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    static readonly ALL_ASSIGNEES_SELECTED = 20000;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static readonly ASSIGNEE_MAP_FUNC = (user: AssigneeUser) => ({
        userId: user.userId,
        name: user.name,
        isSelected: false
    });

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
                    isObject<{ subjects: string[] }>(response, [
                        ['subjects', 'array']
                    ]) &&
                    response.subjects.every((val) => typeof val === 'string')
                        ? of(this.createSubjectList(response.subjects))
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

    addSubject(
        name: string,
        isPrivate: boolean,
        assigneeList: string[]
    ): Promise<string> {
        const subject = isPrivate ? `_${name}` : name;
        const assignees = assigneeList.length > 0 ? assigneeList : null;
        return this.http
            .post(ServerRoutes.subjectCreate, { subject, assignees })
            .pipe(switchMap(() => of(subject)))
            .toPromise();
    }

    getAssignees(
        subjectId: string,
        teacherList: AssigneeUser[]
    ): Promise<Assignee[]> {
        return this.http
            .post(ServerRoutes.subjectInfo, { subject: subjectId })
            .pipe(
                switchMap((response) => {
                    if (
                        isObject<{ assignees: unknown[] | null }>(response, [
                            ['assignees', 'array|null']
                        ])
                    ) {
                        if (response.assignees === null) {
                            return throwError({
                                status: SubjectService.ALL_ASSIGNEES_SELECTED
                            });
                        }
                        else if (isAssigneeItemList(response.assignees)) {
                            return of(
                                mapAssignees(teacherList, response.assignees)
                            );
                        }
                    }
                    return throwError({ status: TYPE_ERROR });
                })
            )
            .toPromise();
    }

    setAssignees(subjectId: string, assigneeList: Assignee[] | null) {
        const assignees =
            assigneeList
                ?.filter((user) => user.isSelected)
                .map((user) => user.userId) ?? null;
        return this.http
            .post(ServerRoutes.subjectPermit, { subject: subjectId, assignees })
            .toPromise();
    }
}
