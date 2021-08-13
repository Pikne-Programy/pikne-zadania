import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { getErrorCode } from 'src/app/helper/utils';
import { AccountService } from '../account.service';

const SpecialLogins: string[] = ['admin', 'root'];

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  //Error codes
  readonly GeneralError = 488;
  readonly SubmitError = 401;

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
      .then(() => this.accountService.getAccount())
      .then((account) => {
        this.isSubmitted = false;
        if (account.error === null && account.observable.getValue() !== null)
          this.navigateBack('/user/dashboard');
        else this.submitErrorCode = account.error ?? this.GeneralError;
      })
      .catch((error) => {
        this.isSubmitted = false;
        this.submitErrorCode = getErrorCode(error, this.GeneralError);
      });
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
    return (control: AbstractControl): { [key: string]: any } | null =>
      SpecialLogins.includes(control.value) ? null : Validators.email(control);
  }
}
