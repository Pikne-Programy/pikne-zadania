import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModificationComponent } from 'src/app/guards/progress-save-guard.service';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { TeamService } from 'src/app/user/team.service/team.service';
import { AssigneeUser } from 'src/app/user/team.service/types';
import {
    Assignee,
    Subject,
    SubjectService
} from '../../subject.service/subject.service';

enum ErrorType {
    TEACHER_LIST = 't',
    ASSIGNEE_LIST = 'a'
}

@Component({
    selector: 'app-subject-permit',
    templateUrl: './permit.component.html',
    styleUrls: ['./permit.component.scss']
})
export class SubjectPermitComponent
    extends ModificationComponent
    implements OnInit, OnDestroy {
    subjectId?: string;
    private teacherList?: AssigneeUser[];
    assignees?: Assignee[];
    allSelected = false;

    isLoading = true;
    private _errorCode: [number, ErrorType] | null = null;
    get errorCode(): string | null {
        if (!this._errorCode) return null;
        const [code, type] = this._errorCode;
        return `${code}${type}`;
    }
    private _isModified = false;
    isSubmitLoading = false;
    submitErrorCode: number | null = null;

    private params$?: Subscription;
    constructor(
        private subjectService: SubjectService,
        private teamService: TeamService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        this.params$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            if (subjectId) {
                this.subjectId = subjectId;
                this.teamService
                    .getAssigneeList()
                    .catch((error) => {
                        this._errorCode = [
                            getErrorCode(error),
                            ErrorType.TEACHER_LIST
                        ];
                        return undefined;
                    })
                    .then((teacherList) => {
                        if (teacherList) {
                            this.teacherList = teacherList;
                            return this.subjectService.getAssignees(
                                subjectId,
                                teacherList
                            );
                        }
                        else return undefined;
                    })
                    .then((assignees) => (this.assignees = assignees))
                    .catch((error) => {
                        if (this.teacherList) {
                            const code = getErrorCode(error);
                            if (
                                code === SubjectService.ALL_ASSIGNEES_SELECTED
                            ) {
                                this.assignees = this.teacherList.map(
                                    SubjectService.ASSIGNEE_MAP_FUNC
                                );
                                this.allSelected = true;
                            }
                            else {
                                this._errorCode = [
                                    code,
                                    ErrorType.ASSIGNEE_LIST
                                ];
                            }
                        }
                    })
                    .finally(() => (this.isLoading = false));
            }
        });
    }

    getPanelHeader(): string {
        return this.subjectId ? Subject.getSubjectName(this.subjectId) : '';
    }

    checkAll() {
        this.allSelected = !this.allSelected;
        this._isModified = true;
    }

    checkAssignee(assignee: Assignee) {
        assignee.isSelected = !assignee.isSelected;
        this._isModified = true;
    }

    isModified(): boolean {
        return this._isModified;
    }

    submit(nextRoute?: string) {
        if (this.subjectId && this.assignees) {
            this.subjectService
                .setAssignees(
                    this.subjectId,
                    this.allSelected ? null : this.assignees
                )
                .then(() => {
                    this.setSubmitFlag();
                    if (nextRoute) this.router.navigateByUrl(nextRoute);
                    else {
                        this.router.navigate(['../'], {
                            relativeTo: this.route
                        });
                    }
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
        this.confirmExit();
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    onExitSubmit(): void {
        this.isConfirmExitModalOpen = false;
        this.submit(this.nextState);
    }

    onExitDiscard(): void {
        this.isConfirmExitModalOpen = false;
        this.confirmExit();
        if (this.nextState) this.router.navigateByUrl(this.nextState);
        else this.router.navigate(['../'], { relativeTo: this.route });
    }

    ngOnDestroy() {
        this.params$?.unsubscribe();
    }
}
