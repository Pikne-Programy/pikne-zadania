import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModificationComponent } from 'src/app/guards/progress-save-guard.service';
import { ExerciseModificationFormComponent } from './form/form.component';
import {
    Exercise,
    ExerciseModificationService
} from './service/exercise-modification.service';

@Component({
    template: ''
})
export abstract class ExerciseModComponent
    extends ModificationComponent
    implements OnInit, OnDestroy {
    protected readonly SubjectError = 40020;
    protected readonly ExerciseError = 40021;

    subjectId?: string;
    exerciseId?: string | null;
    exercise?: Exercise;
    exerciseSet?: Set<string> | null;
    @ViewChild('formComponent')
    private formComponent?: ExerciseModificationFormComponent;

    isLoading = true;
    protected _errorCode: number | null = null;
    abstract get errorCode(): number | null;

    protected param$?: Subscription;
    constructor(
        protected exerciseService: ExerciseModificationService,
        protected router: Router,
        protected route: ActivatedRoute
    ) {
        super();
    }

    abstract ngOnInit(): void;

    /* istanbul ignore next */
    ngOnDestroy() {
        this.param$?.unsubscribe();
    }

    abstract getErrorMessage(errorCode: number): string | undefined;

    isModified(): boolean {
        return this.formComponent?.isModified() ?? true;
    }

    onSuccess(route?: string) {
        if (route) {
            this.setSubmitFlag();
            this.router.navigateByUrl(route);
        }
        else if (this.subjectId) {
            this.setSubmitFlag();
            this.router.navigate(['/subject/dashboard', this.subjectId]);
        }
    }
    onCancel() {
        if (this.subjectId) {
            this.confirmExit();
            this.router.navigate(['/subject/dashboard', this.subjectId]);
        }
    }

    onExitSubmit() {
        this.isConfirmExitModalOpen = false;
        this.formComponent?.submit(this.nextState);
        this.resetNavigation();
    }
    onExitDiscard() {
        this.isConfirmExitModalOpen = false;
        if (this.nextState) {
            this.confirmExit();
            this.router.navigateByUrl(this.nextState);
        }
        else this.onCancel();
    }
}
