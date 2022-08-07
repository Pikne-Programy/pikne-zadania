import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModificationComponent } from 'src/app/guards/progress-save-guard.service';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { Subject } from '../../subject.service/subject.service';
import {
    CategoryExercise,
    HierarchyService
} from '../service/hierarchy.service';

@Component({
    selector: 'app-category-modification',
    templateUrl: './category-modification.component.html',
    styleUrls: ['./category-modification.component.scss']
})
export class CategoryModificationComponent
    extends ModificationComponent
    implements OnInit, OnDestroy {
    subject?: string;
    exercises?: CategoryExercise[];
    filteredExercises?: CategoryExercise[];

    isLoading = true;
    errorCode: number | null = null;
    private _isModified = false;
    isSubmitLoading = false;
    submitErrorCode: number | null = null;
    isDiscardModalOpen = false;

    private param$?: Subscription;
    constructor(
        private hierarchyService: HierarchyService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super();
    }

    isModified(): boolean {
        return this._isModified;
    }

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            if (subjectId) {
                this.subject = subjectId;
                if (!this.hierarchyService.getCategoryRoute()) this.cancel();
                const promise = this.hierarchyService.shouldGetFromSubject()
                    ? this.hierarchyService.getNewExercisesForSubject(
                          this.subject
                      )
                    : this.hierarchyService.getNewExercisesForCategory(
                          this.subject
                      );
                promise
                    .then((exercises) => {
                        this.exercises = this.sortExercises(exercises);
                        this.filteredExercises = this.exercises;
                    })
                    .catch((error) => (this.errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });
    }

    private sortExercises(exercises: CategoryExercise[]): CategoryExercise[] {
        return exercises.sort((a, b) => a.name.localeCompare(b.name));
    }

    getSubjectName(subjectId: string): string {
        return Subject.getSubjectName(subjectId);
    }

    getPanelHeader(): string[] {
        const segments = this.hierarchyService.getCategoryRoute();
        if (!this.subject || !segments) {
            this.errorCode = INTERNAL_ERROR;
            return [];
        }
        return segments;
    }

    selectExercise(exercise: CategoryExercise) {
        this._isModified = true;
        exercise.isSelected = !exercise.isSelected;
    }

    submit(nextRoute?: string) {
        if (this.subject && this.exercises) {
            this.isSubmitLoading = true;
            this.hierarchyService
                .addNewExercisesToCategory(this.subject, this.exercises)
                .then(() => {
                    this.setSubmitFlag();
                    if (nextRoute) this.router.navigateByUrl(nextRoute);
                    else this.navigateToDashboard();
                })
                .catch((error) => (this.submitErrorCode = getErrorCode(error)))
                .finally(() => {
                    this.isSubmitLoading = false;
                    this.resetNavigation();
                });
        }
        else this.submitErrorCode = INTERNAL_ERROR;
    }

    cancel() {
        if (this._isModified) this.isDiscardModalOpen = true;
        else {
            this.confirmExit();
            this.navigateToDashboard();
        }
    }

    onExitSubmit(): void {
        this.isConfirmExitModalOpen = false;
        this.submit(this.nextState);
    }

    onExitDiscard(): void {
        this.isConfirmExitModalOpen = false;
        this.confirmExit();
        if (this.nextState) this.router.navigateByUrl(this.nextState);
        else this.navigateToDashboard();
    }

    private navigateToDashboard() {
        if (this.subject)
            this.router.navigate(['/subject/dashboard', this.subject]);
        else this.router.navigate(['/subject/list']);
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }

    //#region Searching
    searchWord = '';

    search() {
        const searched = this.searchWord.trim().toLocaleLowerCase();
        this.filteredExercises = this.exercises
            ?.filter(
                (exercise) =>
                    searched.length === 0 ||
                    exercise.isSelected ||
                    exercise.name.toLocaleLowerCase().includes(searched)
            )
            ?.sort((a, b) => {
                if (searched.length !== 0) {
                    if (a.isSelected && !b.isSelected) return -1;
                    if (!a.isSelected && b.isSelected) return 1;
                    const aIndex = a.name.toLocaleLowerCase().indexOf(searched);
                    const bIndex = b.name.toLocaleLowerCase().indexOf(searched);
                    if (aIndex === -1 && bIndex !== -1) return 1;
                    if (aIndex !== -1 && bIndex === -1) return -1;
                    if (aIndex !== bIndex) return aIndex - bIndex;
                }
                return a.name.localeCompare(b.name);
            });
    }
    //#endregion
}
