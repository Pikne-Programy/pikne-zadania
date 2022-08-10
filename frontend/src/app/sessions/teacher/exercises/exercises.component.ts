import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode, INTERNAL_ERROR, TYPE_ERROR } from 'src/app/helper/utils';
import { ViewExercise } from 'src/app/subjects/dashboard/exercise-previews/preview.component';
import {
    ExerciseError,
    Subject,
    ViewExerciseTreeNode
} from 'src/app/subjects/subject.service/subject.service';
import { SessionService } from '../../services/session.service';

type ExerciseList = {
    subject: Subject;
    exercises: Exercise[];
}[];

type Exercise = {
    id: string;
    name: string;
};

@Component({
    selector: 'app-exercises',
    templateUrl: './exercises.component.html',
    styleUrls: [
        './exercises.component.scss',
        '../../../subjects/dashboard/dashboard.component.scss'
    ]
})
export class AddSessionExercisesComponent implements OnInit, OnDestroy {
    teamId?: number;
    categoryTree?: ViewExerciseTreeNode;
    subjectList?: Subject[];
    currentSubject?: string;
    currentNode?: ViewExerciseTreeNode;
    exerciseList: ViewExercise[] | null = null;
    private addedExercises: Map<string, Map<string, ViewExercise>> = new Map();
    get addedExerciseList(): ExerciseList {
        const result: ExerciseList = [];
        for (const [subjectId, exerciseMap] of this.addedExercises) {
            const exercises: Exercise[] = [];
            for (const exercise of exerciseMap.values()) {
                exercises.push({
                    id: exercise.id,
                    name: exercise.name
                });
            }
            result.push({
                subject: new Subject(subjectId),
                exercises: exercises.sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            });
        }
        return result.sort((a, b) => {
            const comp = a.subject.getName().localeCompare(b.subject.getName());
            if (comp === 0) {
                if (a.subject.isPrivate && !b.subject.isPrivate) return -1;
                if (!a.subject.isPrivate && b.subject.isPrivate) return 1;
            }
            return comp;
        });
    }

    isLoading = true;
    errorCode: number | null = null;
    isExerciseLoading = false;
    exerciseError: ExerciseError | null = null;
    isExerciseListLoading = false;
    subjectErrorCode: number | null = null;

    subjectCache: Map<string, ViewExerciseTreeNode> = new Map();
    param$?: Subscription;
    constructor(
        private sessionService: SessionService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const teamId = Number(params.get('teamId'));
            if (!isNaN(teamId)) {
                this.teamId = teamId;
                this.sessionService
                    .getSubjects()
                    .then((subjects) => {
                        this.subjectList = subjects;
                        return this.sessionService.getAddedExercises(teamId);
                    })
                    .then((pairs) => {
                        for (const [subjectId, exercise] of pairs) {
                            if (!this.addedExercises.has(subjectId))
                                this.addedExercises.set(subjectId, new Map());
                            this.addedExercises
                                .get(subjectId)!
                                .set(exercise.id, exercise);
                        }
                    })
                    .catch((error) => (this.errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });
    }

    addExercise(subjectId: string, exercise: ViewExercise) {
        if (this.teamId !== undefined) {
            this.isExerciseListLoading = true;
            this.sessionService
                .addExercise(this.teamId, subjectId, exercise)
                .then(() => {
                    if (!this.addedExercises.has(subjectId))
                        this.addedExercises.set(subjectId, new Map());
                    this.addedExercises
                        .get(subjectId)!
                        .set(exercise.id, exercise);
                })
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => (this.isExerciseListLoading = false));
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    removeExercise(subjectId: string, exerciseId: string) {
        if (this.teamId !== undefined) {
            this.isExerciseListLoading = true;
            this.sessionService
                .deleteExercise(this.teamId, subjectId, exerciseId)
                .then(() =>
                    this.addedExercises.get(subjectId)?.delete(exerciseId)
                )
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => (this.isExerciseListLoading = false));
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    async onSubjectClick(subject: Subject) {
        if (this.currentSubject !== subject.id) {
            if (this.categoryTree)
                this.clearSelectedChildren(this.categoryTree);

            this.currentSubject = subject.id;
            this.categoryTree = await this.getCategoryTree(subject.id);
            this.currentNode = this.categoryTree;
            this.getCurrentNodeExercises();
        }
        else this.currentSubject = undefined;
    }

    private getCategoryTree(
        subjectId: string
    ): Promise<ViewExerciseTreeNode | undefined> {
        const fromCache = this.subjectCache.get(subjectId);
        if (fromCache) return Promise.resolve(fromCache);

        this.isExerciseListLoading = true;
        return this.sessionService
            .getSubjectExercises(subjectId)
            .then((tree) => {
                this.subjectCache.set(subjectId, tree);
                return tree;
            })
            .catch((error) => {
                this.subjectErrorCode = getErrorCode(error);
                return undefined;
            })
            .finally(() => (this.isExerciseListLoading = false));
    }

    checkNodeChildren(node: ViewExerciseTreeNode): boolean {
        return node.children.some((child) => child.url === null);
    }

    checkNodeIfIsCategory(node: ViewExerciseTreeNode): boolean {
        return node.url === null && node.value !== '';
    }

    onTreeNodeClick(node: ViewExerciseTreeNode) {
        const newState = !node.isSelected;
        this.currentNode = newState
            ? node
            : node.parent
                ? node.parent
                : this.categoryTree;

        node.parent?.children.forEach((child) => {
            child.isSelected = false;
            this.clearSelectedChildren(child);
        });
        node.isSelected = newState;
        this.getCurrentNodeExercises();
        if (!node.isSelected) this.clearSelectedChildren(node);
    }

    clearSelectedChildren(node: ViewExerciseTreeNode) {
        node.children.forEach((child) => {
            child.isSelected = false;
            this.clearSelectedChildren(child);
        });
    }

    getCurrentNodeExercises() {
        this.exerciseError = null;

        if (!this.currentNode) {
            this.exerciseList = null;
            return;
        }
        if (!this.currentSubject) {
            this.exerciseList = null;
            return;
        }

        const exercises: ViewExerciseTreeNode[] =
            this.currentNode.children.filter((node) => node.url);

        if (exercises.length === 0) {
            this.exerciseList = null;
            return;
        }
        for (const node of exercises) {
            if (!node.type) {
                this.exerciseError = { code: TYPE_ERROR, id: node.url! };
                return;
            }
        }

        this.isExerciseLoading = true;
        this.exerciseList = exercises.map((node) => ({
            id: node.url!,
            type: node.type!,
            name: node.value,
            desc: node.description
        }));
    }

    isLast(index: number): boolean {
        return !this.exerciseList || index === this.exerciseList.length - 1;
    }

    getExerciseAction(subjectId: string, exerciseId: string): 'add' | 'added' {
        if (this.addedExercises.get(subjectId)?.has(exerciseId) ?? false)
            return 'added';
        else return 'add';
    }

    executeExerciseAction(subjectId: string, exercise: ViewExercise) {
        switch (this.getExerciseAction(subjectId, exercise.id)) {
            case 'add':
                this.addExercise(subjectId, exercise);
                break;
            case 'added':
                this.removeExercise(subjectId, exercise.id);
                break;
        }
    }

    getExerciseErrorMessage(error: ExerciseError): string {
        return `Błąd podczas ładowania zadania '${error.id}'`;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
