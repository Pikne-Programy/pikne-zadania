import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from 'src/app/account/account.service';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { getErrorCode } from 'src/app/helper/utils';
import { InternalError } from '../../dashboard/dashboard.utils';
import { TeamService } from '../../team.service/team.service';
import { Team, User } from '../../team.service/types';

enum ModalType {
  NAME,
  OPEN_INV,
  CLOSE_INV,
  ASSIGNEE,
  EDIT_USER,
  DELETE_USER,
}

@Component({
  selector: 'app-team-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
})
export class TeamItemComponent implements OnInit {
  private readonly IdError = 400;
  private readonly AccountError = 420;
  readonly InternalError = InternalError;

  teamId?: number;
  team?: Team;

  isAdmin = false;
  isLoading = true;
  errorCode: number | null = null;
  defaultErrorMessage = true;

  constructor(
    private teamService: TeamService,
    private accountService: AccountService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.fetchTeam();
  }

  private fetchTeam() {
    const teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    if (!isNaN(teamId)) {
      this.teamId = teamId;
      RoleGuardService.getPermissions(this.accountService)
        .then(
          (role) =>
            (this.isAdmin =
              role === Role.ADMIN && RoleGuardService.canEditAssignee(teamId))
        )
        .catch((error) => {
          this.defaultErrorMessage = false;
          throw { status: getErrorCode(error, this.AccountError) };
        })
        .then(() => this.teamService.getTeam(teamId))
        .then((team) => (this.team = team))
        .catch((error) => (this.errorCode = getErrorCode(error, this.IdError)))
        .finally(() => (this.isLoading = false));
    } else {
      this.errorCode = this.IdError;
      this.isLoading = false;
    }
  }

  //#region Modals
  ModalType = ModalType;
  openedModal: ModalType | null = null;
  isModalLoading = false;
  isModalSecondaryLoading = false;
  modalErrorCode: number | null = null;

  //#region Error codes
  private readonly NameError = 440;
  private readonly OpenInvError = 441;
  private readonly CloseInvError = 442;
  private readonly FetchAssigneesError = 443;
  private readonly AssigneeError = 445;
  private readonly UserError = 446;
  private readonly InputError = 447;
  //#endregion

  openModal(type: ModalType) {
    this.openedModal = type;
  }
  closeModal() {
    if (!this.isModalLoading && !this.isModalSecondaryLoading) {
      const type = this.openedModal;
      this.openedModal = null;
      this.modalErrorCode = null;
      this.isModalLoading = false;
      this.isModalSecondaryLoading = false;
      this.assigneeList = [];
      this.selectedAssignee = null;
      this.selectedUser = null;

      switch (type) {
        case ModalType.NAME:
          this.nameForm.reset();
          break;
        case ModalType.OPEN_INV:
          this.invitationForm.reset();
          break;
        case ModalType.EDIT_USER:
          this.userForm.reset();
          break;
      }
    }
  }

  //#region Change Team name
  nameForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });
  get name() {
    return this.nameForm.get('name');
  }

  changeName() {
    if (this.teamId !== undefined) {
      this.isModalLoading = true;
      this.teamService
        .setTeamName(this.teamId, this.name!.value)
        .then(() => this.onModalSuccess())
        .catch((error) => this.onModalError(error, this.NameError));
    } else this.modalErrorCode = this.InternalError;
  }
  //#endregion

  //#region Open/Close registration
  invitationForm = new FormGroup({
    invCode: new FormControl('', [Validators.required]),
  });
  get invCode() {
    return this.invitationForm.get('invCode');
  }

  private submitRegistration(promise: Promise<Object>, errorCode: number) {
    promise
      .then(() => {
        this.isModalSecondaryLoading = false;
        this.onModalSuccess();
      })
      .catch((error) => {
        this.onModalError(error, errorCode);
        this.isModalSecondaryLoading = false;
      });
  }

  openRegistration(generate: boolean) {
    if (this.teamId !== undefined) {
      if (generate) this.isModalSecondaryLoading = true;
      else this.isModalLoading = true;
      this.submitRegistration(
        this.teamService.openTeam(
          this.teamId,
          generate ? null : this.invCode!.value
        ),
        this.OpenInvError
      );
    } else this.modalErrorCode = this.InternalError;
  }

  closeRegistration() {
    if (this.teamId !== undefined) {
      this.isModalLoading = true;
      this.submitRegistration(
        this.teamService.closeTeam(this.teamId),
        this.CloseInvError
      );
    } else this.modalErrorCode = this.InternalError;
  }
  //#endregion

  //#region Change Assignee
  assigneeList: User[] = [];
  selectedAssignee: number | null = null;

  getAssignees() {
    this.isModalSecondaryLoading = true;
    this.teamService
      .getAssigneeList()
      .then((users) => {
        this.assigneeList = users;
      })
      .catch((error) => {
        this.modalErrorCode = getErrorCode(error, this.FetchAssigneesError);
      })
      .finally(() => (this.isModalSecondaryLoading = false));
  }

  chooseAssignee() {
    if (this.teamId === undefined) this.errorCode = this.InternalError;
    else if (
      this.selectedAssignee !== null &&
      this.selectedAssignee >= 0 &&
      this.selectedAssignee < this.assigneeList.length
    ) {
      this.isModalLoading = true;
      this.teamService
        .setAssignee(this.teamId, this.assigneeList[this.selectedAssignee].id)
        .then(() => this.onModalSuccess())
        .catch((error) => this.onModalError(error, this.AssigneeError));
    } else this.modalErrorCode = this.AssigneeError;
  }
  //#endregion

  //#region Edit/Delete Member
  selectedUser: User | null = null;
  userForm = new FormGroup({
    userNumber: new FormControl('', [
      Validators.required,
      Validators.pattern('^\\d*$'),
    ]),
  });
  get userNumber() {
    return this.userForm.get('userNumber');
  }

  editUser(resetNumber: boolean = false) {
    const newNumber = Number(this.userNumber!.value);
    if (!resetNumber && isNaN(newNumber)) this.modalErrorCode = this.InputError;
    else if (this.teamId === undefined) this.errorCode = this.InternalError;
    else if (this.selectedUser) {
      if (resetNumber) this.isModalSecondaryLoading = true;
      else this.isModalLoading = true;
      this.teamService
        .setUserNumber(
          this.teamId,
          this.selectedUser.id,
          resetNumber ? null : newNumber
        )
        .then(() => {
          this.isModalSecondaryLoading = false;
          this.onModalSuccess();
        })
        .catch((error) => {
          this.onModalError(error, this.UserError);
          this.isModalSecondaryLoading = false;
        });
    } else this.modalErrorCode = this.UserError;
  }

  deleteUser() {
    if (this.teamId === undefined) this.errorCode = this.InternalError;
    else if (this.selectedUser) {
      this.isModalLoading = true;
      this.teamService
        .removeUser(this.teamId, this.selectedUser.id)
        .then(() => this.onModalSuccess())
        .catch((error) => this.onModalError(error, this.UserError));
    } else this.modalErrorCode = this.UserError;
  }
  //#endregion

  //#region Result functions
  private onModalSuccess() {
    this.isModalLoading = false;
    this.closeModal();
    this.fetchTeam();
  }

  private onModalError(error: any, fallback: number) {
    this.modalErrorCode = getErrorCode(error, fallback);
    this.isModalLoading = false;
  }
  //#endregion
  //#endregion
}
