import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';
import { ExerciseTreeNode } from '../exercise-service/exercise.utils';
import { categorySeparator, Exercise } from '../exercise-service/exercises';
import { getErrorCode } from '../helper/utils';
import { Subject } from '../subjects/subject.service/subject.service';

@Component({
    selector: 'app-public-exercises',
    templateUrl: './public-exercises.component.html',
    styleUrls: ['./public-exercises.component.scss']
})
export class PublicExercisesComponent implements OnInit, OnDestroy {
    private readonly SubjectError = 420;
    private readonly TreeError = 421;

    @Input() isSingleSubject = false;
    isLoading = true;
    errorCode: number | null = null;
    isExerciseLoading = false;
    exerciseErrorCode: number | null = null;

    subjectId?: string;
    tree?: ExerciseTreeNode;
    currentNode?: ExerciseTreeNode;
    breadcrumbs: ExerciseTreeNode[] = [];
    exerciseId: string | null = null;
    exercise: Exercise | null = null;

    private params$?: Subscription;
    private queryParams$?: Subscription;
    constructor(
        private exerciseService: ExerciseService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.isSingleSubject =
            this.route.snapshot.queryParamMap.get('isSingleSubject') !== null;
        this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { isSingleSubject: null },
            queryParamsHandling: 'merge'
        });

        this.params$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            if (subjectId) {
                this.subjectId = subjectId;
                this.getExerciseTree();
            }
            else this.throwError();
        });

        this.queryParams$ = this.route.queryParamMap.subscribe((params) => {
            this.getExercise(params);
        });
    }

    ngOnDestroy() {
        this.params$?.unsubscribe();
        this.queryParams$?.unsubscribe();
    }

    getBreadcrumb(node: ExerciseTreeNode, index: number) {
        if (index > 0) return node.value;
        return Subject.getSubjectName(node.value);
    }

    isSubjectPrivate(node: ExerciseTreeNode, index: number) {
        return index === 0 && Subject.checkIfPrivate(node.value);
    }

    navigate(node: ExerciseTreeNode) {
        if (node.url !== null) {
            this.router.navigate(['./'], {
                relativeTo: this.route,
                queryParams: { exercise: node.url },
                queryParamsHandling: 'merge'
            });
        }
        else {
            this.currentNode = node;
            this.breadcrumbs.push(node);
            this.router.navigate(['./'], {
                relativeTo: this.route,
                queryParams: { categories: this.getCategories() },
                queryParamsHandling: 'merge'
            });
        }
    }

    navigateToBreadcrumb(node: ExerciseTreeNode, index: number) {
        this.currentNode = node;
        this.breadcrumbs.splice(index + 1);
        this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { categories: this.getCategories() },
            queryParamsHandling: 'merge'
        });
    }

    private navigateToCategories(categories: string) {
        const catList = categories.split(categorySeparator);
        if (this.tree) {
            let current = this.tree;
            for (const category of catList) {
                const newNode = current.children.find(
                    (child) => child.value === category
                );
                if (!newNode) break;
                current = newNode;
                this.breadcrumbs.push(newNode);
            }
            this.currentNode = current;
        }
        else this.throwError(this.TreeError);
    }

    private getCategories(): string | null {
        const catList = this.breadcrumbs.slice(1);
        return catList.length > 0
            ? catList.map((node) => node.value).join(categorySeparator)
            : null;
    }

    private getExerciseTree() {
        if (this.subjectId) {
            this.exerciseService
                .getExerciseTree(this.subjectId)
                .then((response) => {
                    this.tree = response;
                    this.currentNode = response;
                    this.breadcrumbs = [response];
                    const cat =
                        this.route.snapshot.queryParamMap.get('categories');
                    if (cat) this.navigateToCategories(cat);
                })
                .catch((error) => this.throwError(getErrorCode(error)))
                .finally(() => (this.isLoading = false));
        }
        else this.throwError();
    }

    refreshExerciseTree() {
        this.getExerciseTree();
    }

    private getExercise(params: ParamMap) {
        const exerciseId = params.get('exercise');
        if (this.exercise?.id !== exerciseId) {
            this.exerciseId = exerciseId;
            if (!exerciseId) this.exercise = null;
            else if (!this.subjectId) this.throwError();
            else {
                this.isExerciseLoading = true;
                this.exerciseService
                    .getExercise(this.subjectId, exerciseId)
                    .then((exercise) => (this.exercise = exercise))
                    .catch(
                        (error) =>
                            (this.exerciseErrorCode = getErrorCode(error))
                    )
                    .finally(() => (this.isExerciseLoading = false));
            }
        }
    }

    isExerciseSelected(node: ExerciseTreeNode): boolean {
        return this.exerciseId !== null && node.url === this.exerciseId;
    }

    resetExercise() {
        this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { exercise: null },
            queryParamsHandling: 'merge'
        });
    }

    getErrorMessage(errorCode: number, fromExercise?: boolean) {
        switch (errorCode) {
            case 404:
                return fromExercise
                    ? 'Ups, zadanie, którego szukasz, nie istnieje!'
                    : 'Ups, przedmiot, którego szukasz, nie istnieje!';
            case 500:
                return 'Błąd serwera';
            default:
                return undefined;
        }
    }

    private throwError(error: number = this.SubjectError) {
        this.errorCode = error;
        this.isLoading = false;
    }
}
