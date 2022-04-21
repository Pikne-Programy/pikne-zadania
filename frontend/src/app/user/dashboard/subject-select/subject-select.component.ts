import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode } from 'src/app/helper/utils';
import {
    Subject,
    SubjectService
} from 'src/app/subjects/subject.service/subject.service';
import { SpecialPanelItem } from 'src/app/templates/panel/panel.component';
import { INTERNAL_ERROR } from '../dashboard.utils';

@Component({
    selector: 'app-subject-select',
    templateUrl: './subject-select.component.html',
    styleUrls: ['./subject-select.component.scss']
})
export class SubjectSelectComponent implements OnInit, OnDestroy {
    mainLink?: string;
    list: SpecialPanelItem[] = [];

    isLoading = true;
    private _errorCode: number | null = null;
    get errorCode() {
        return this._errorCode ?? !this.mainLink ? INTERNAL_ERROR : null;
    }

    private param$?: Subscription;
    constructor(
        private subjectService: SubjectService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const link = params.get('newLink');
            if (link) {
                this.mainLink = decodeURIComponent(link);
                this.subjectService
                    .getSubjects()
                    .then((subjects) => (this.list = this.createList(subjects)))
                    .catch((error) => (this._errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });
    }

    private createList(subjects: Subject[]): SpecialPanelItem[] {
        return subjects.map((subject) => [
            subject.getName(),
            subject.id,
            subject.isPrivate ? 'fa-lock' : 'fa-book',
            false,
            subject.isPrivate
        ]);
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
