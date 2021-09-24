import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
    Exercise,
    ExerciseModificationService
} from './service/exercise-modification.service';

@Component({
    template: ''
})
export abstract class ExerciseModComponent implements OnInit, OnDestroy {
    protected readonly SubjectError = 40020;
    protected readonly ExerciseError = 40021;

    subjectId?: string;
    exerciseId?: string | null;
    exercise?: Exercise;
    exerciseSet?: Set<string> | null;

    isLoading = true;
    protected _errorCode: number | null = null;
    abstract get errorCode(): number | null;

    protected param$?: Subscription;
    constructor(
        protected exerciseService: ExerciseModificationService,
        protected router: Router,
        protected route: ActivatedRoute
    ) {}

    abstract ngOnInit(): void;

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }

    abstract getErrorMessage(errorCode: number): string | undefined;

    onSuccess() {
        if (this.subjectId)
            this.router.navigate(['/subject/dashboard', this.subjectId]);
    }
    onCancel() {
        if (this.subjectId)
            this.router.navigate(['/subject/dashboard', this.subjectId]);
    }
}
