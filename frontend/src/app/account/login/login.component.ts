import { Component, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  //Error codes
  readonly generalError = 400;
  readonly submitError = 401;

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, this.emailValidator()]),
    password: new FormControl('', [Validators.required]),
  });

  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  isSubmitted = false;
  submitSubscription?: Subscription;
  loginSubscription?: Subscription;
  submitErrorCode: number | null = null;
  returnUrl: string | null;
  constructor(
    private accountService: AccountService,
    private router: Router,
    route: ActivatedRoute
  ) {
    const url = route.snapshot.queryParams['returnUrl'];
    this.returnUrl = typeof url === 'string' ? url : null;
  }

  submit() {
    this.isSubmitted = true;
    this.submitErrorCode = null;
    this.accountService
      .login(this.email!.value, this.password!.value)
      .then((obs) => {
        this.submitSubscription?.unsubscribe();
        this.submitSubscription = obs.subscribe(
          () => {
            this.loginSubscription?.unsubscribe();
            this.accountService
              .getAccount()
              .then((account) => {
                this.isSubmitted = false;
                if (
                  account.error === null &&
                  account.observable.getValue() !== null
                )
                  //TODO Change to Account dashboard path
                  this.navigateBack('/public-exercises');
                else this.submitErrorCode = account.error ?? this.generalError;
              })
              .catch((error) => {
                this.isSubmitted = false;
                this.submitErrorCode = error.status ?? this.generalError;
              });
          },
          (error) => {
            this.isSubmitted = false;
            this.submitErrorCode = error.status;
          }
        );
      });
  }

  ngOnDestroy() {
    this.submitSubscription?.unsubscribe();
    this.loginSubscription?.unsubscribe();
  }

  clearError() {
    this.submitErrorCode = null;
  }

  navigateBack(fallback: string = '/public-exercises') {
    this.router.navigateByUrl(
      this.returnUrl !== null ? this.returnUrl : fallback
    );
  }

  private emailValidator(): ValidatorFn {
    const specialLogins = ['admin', 'root'];
    return (control: AbstractControl): { [key: string]: any } | null =>
      specialLogins.includes(control.value) ? null : Validators.email(control);
  }
}
