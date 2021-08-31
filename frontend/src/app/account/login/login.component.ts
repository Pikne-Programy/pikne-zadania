import { Component } from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { getErrorCode } from 'src/app/helper/utils';
import { UpNavService } from 'src/app/navigation/services/up-navigation.service';
import { AccountService } from '../account.service';

const SPECIAL_LOGINS: string[] = ['admin', 'root'];

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    // Error codes
    readonly GeneralError = 488;
    readonly SubmitError = 401;

    readonly form = new FormGroup({
        email: new FormControl('', [
            Validators.required,
            this.emailValidator()
        ]),
        password: new FormControl('', [Validators.required])
    });

    get email() {
        return this.form.get('email');
    }
    get password() {
        return this.form.get('password');
    }

    isSubmitted = false;
    submitErrorCode: number | null = null;
    constructor(
        private accountService: AccountService,
        private upNavService: UpNavService
    ) {}

    submit() {
        this.isSubmitted = true;
        this.submitErrorCode = null;
        this.accountService
            .login(this.email!.value, this.password!.value)
            .then(() => this.accountService.getAccount())
            .then((account) => {
                this.isSubmitted = false;
                if (
                    account.error === null &&
                    account.observable.getValue() !== null
                )
                    this.upNavService.navigateBack('/user/dashboard');
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
        this.upNavService.forceNavigateBack(fallback);
    }

    private emailValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null =>
            SPECIAL_LOGINS.includes(control.value)
                ? null
                : Validators.email(control);
    }
}
