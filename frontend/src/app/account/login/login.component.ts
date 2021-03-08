import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountService, isAccount } from '../account.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  //Error codes
  readonly submitError = 401;

  readonly form = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(this.accountService.emailPattern),
    ]),
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
  constructor(private accountService: AccountService, private router: Router) {}

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
            this.loginSubscription = this.accountService
              .getAccount()
              .subscribe((account) => {
                if (account !== undefined && account !== null) {
                  this.loginSubscription?.unsubscribe();
                  if (typeof account === 'number' || !isAccount(account)) {
                    this.isSubmitted = false;
                    this.submitErrorCode =
                      typeof account === 'number'
                        ? account
                        : this.accountService.accountTypeError;
                    this.accountService.clearCurrentAccount();
                  } else this.router.navigate(['/public-exercises']); //TODO Change to Account dashboard path or preserved path
                }
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
}
