import { Component, OnDestroy } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.scss'],
})
export class RegisterComponent implements OnDestroy {
  //Error codes
  readonly emailError = 409;
  readonly invitationError = 403;

  readonly form = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(this.accountService.emailPattern),
      this.submitErrorValidator(this.emailError),
    ]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    invitation: new FormControl('', [
      Validators.required,
      this.submitErrorValidator(this.invitationError),
    ]),
    number: new FormControl('', [
      Validators.required,
      Validators.pattern('^\\d*$'),
    ]),
  });

  get email() {
    return this.form.get('email');
  }
  get username() {
    return this.form.get('username');
  }
  get password() {
    return this.form.get('password');
  }
  get invitation() {
    return this.form.get('invitation');
  }
  hasNumber = true;
  get number() {
    return this.form.get('number');
  }

  isTooltipShown = false;
  isSubmitted = false;
  submitSubscription?: Subscription;
  isCreated = false;
  submitErrorCode: number | null = null;
  constructor(private accountService: AccountService) {}

  onToggleSwitch() {
    this.hasNumber = !this.hasNumber;
    if (this.hasNumber)
      this.number?.setValidators([
        Validators.required,
        Validators.pattern('^\\d*$'),
      ]);
    else this.number?.clearValidators();
    this.number?.updateValueAndValidity();
  }

  onInfoClick() {
    this.isTooltipShown = !this.isTooltipShown;
  }

  submit() {
    this.isSubmitted = true;
    this.submitErrorCode = null;
    this.accountService
      .createAccount(
        this.email!.value,
        this.username!.value,
        this.password!.value,
        this.invitation!.value,
        this.hasNumber ? this.number!.value : null
      )
      .then((obs) => {
        this.submitSubscription?.unsubscribe();
        this.submitSubscription = obs.subscribe(
          () => {
            this.isCreated = true;
          },
          (error) => {
            this.isSubmitted = false;
            this.submitErrorCode = error.status;
            this.email!.updateValueAndValidity();
            this.invitation!.updateValueAndValidity();
          }
        );
      });
  }

  ngOnDestroy() {
    this.submitSubscription?.unsubscribe();
  }

  private submitErrorValidator(errorCode: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isError = this.submitErrorCode == errorCode;
      if (isError) this.submitErrorCode = null;
      return isError ? { submitError: { value: control.value } } : null;
    };
  }
}
