import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getErrorCode } from 'src/app/helper/utils';
import { SpecialPanelItem } from 'src/app/templates/panel/panel.component';
import { TeamService } from 'src/app/user/team.service/team.service';
import { User } from 'src/app/user/team.service/types';
import { Subject, SubjectService } from '../subject.service/subject.service';

interface UserItem extends User {
    isSelected: boolean;
}
function mapUsers(list: User[]): UserItem[] {
    return list.map((user) => ({
        userId: user.userId,
        name: user.name,
        number: user.number,
        isSelected: false
    }));
}

@Component({
    selector: 'app-subject-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class SubjectListComponent implements OnInit {
    private readonly ID_ERROR = 409;

    subjectList: Subject[] = [];

    errorCode: number | null = null;
    isLoading = true;
    currentList = 0;
    constructor(
        private subjectService: SubjectService,
        private teamService: TeamService,
        private router: Router
    ) {}

    ngOnInit() {
        this.subjectService
            .getSubjects()
            .then((list) => (this.subjectList = list))
            .catch((error) => (this.errorCode = getErrorCode(error)))
            .finally(() => (this.isLoading = false));
    }

    createList(): SpecialPanelItem[] {
        return this.subjectList.map((subject) => [
            subject.getName(),
            subject.id,
            subject.isPrivate ? 'fa-lock' : 'fa-book',
            false,
            subject.isPrivate
        ]);
    }

    //#region Add subject Modal
    isModalOpen = false;
    modalName = '';
    modalAssigneeList?: UserItem[];
    modalPrivateState = false;
    isModalLoading = false;
    modalAssigneeErrorCode: number | null = null;
    modalErrorCode: number | null = null;

    openModal() {
        this.resetModal();
        this.isModalOpen = true;
        this.teamService
            .getAssigneeList()
            .then((users) => (this.modalAssigneeList = mapUsers(users)))
            .catch(
                (error) => (this.modalAssigneeErrorCode = getErrorCode(error))
            );
    }

    closeModal() {
        this.isModalOpen = false;
        this.resetModal();
    }

    private resetModal() {
        this.modalName = '';
        this.modalAssigneeList = undefined;
        this.modalErrorCode = null;
        this.modalAssigneeErrorCode = null;
        this.modalPrivateState = false;
    }

    isModalValid(): boolean {
        return (
            this.modalName.trim().length > 0 &&
            this.modalAssigneeErrorCode === null &&
            this.modalAssigneeList !== undefined
        );
    }

    getModalErrorMessage(errorCode: number): string {
        switch (errorCode) {
            case this.ID_ERROR:
                return 'Przedmiot o takiej nazwie już istnieje';
            default:
                return `Wystąpił błąd (${errorCode})`;
        }
    }
    //#endregion

    addNewSubject() {
        if (this.isModalValid()) {
            const name = this.modalName.trim();
            const assignees = this.modalAssigneeList!.filter(
                (user) => user.isSelected
            ).map((user) => user.userId);

            this.isModalLoading = true;
            this.subjectService
                .addSubject(name, this.modalPrivateState, assignees)
                .then((subjectId) =>
                    this.router.navigate(['/subject/dashboard', subjectId])
                )
                .catch((error) => (this.modalErrorCode = getErrorCode(error)))
                .finally(() => (this.isModalLoading = false));
        }
    }
}
