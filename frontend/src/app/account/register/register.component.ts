import { Component } from '@angular/core';
import {
    FormGroup,
    FormControl,
    Validators,
    ValidatorFn,
    AbstractControl
} from '@angular/forms';
import { UpNavService } from 'src/app/navigation/services/up-navigation.service';
import { AccountService } from '../account.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent {
    // Error codes
    readonly EmailError = 409;
    readonly InvitationError = 403;

    readonly form = new FormGroup({
        email: new FormControl('', [
            Validators.required,
            Validators.email,
            this.submitErrorValidator(this.EmailError)
        ]),
        name: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required]),
        password2: new FormControl('', [Validators.required]),
        invitation: new FormControl('', [
            Validators.required,
            this.submitErrorValidator(this.InvitationError)
        ]),
        number: new FormControl('', [
            Validators.required,
            Validators.pattern('^\\d*$')
        ])
    });
    constructor(
        private accountService: AccountService,
        private upNavService: UpNavService
    ) {
        this.password!.setValidators([
            Validators.required,
            this.passwordValidator()
        ]);
        this.password2!.setValidators([
            Validators.required,
            this.passwordValidator()
        ]);
    }

    get email() {
        return this.form.get('email');
    }
    get name() {
        return this.form.get('name');
    }
    get password() {
        return this.form.get('password');
    }
    get password2() {
        return this.form.get('password2');
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
    isCreated = false;
    submitErrorCode: number | null = null;

    onToggleSwitch() {
        this.hasNumber = !this.hasNumber;
        if (this.hasNumber) {
            this.number?.setValidators([
                Validators.required,
                Validators.pattern('^\\d*$')
            ]);
        }
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
                this.name!.value,
                this.password!.value,
                this.invitation!.value,
                this.hasNumber ? this.number!.value : null
            )
            .then(() => (this.isCreated = true))
            .catch((error) => {
                this.submitErrorCode = error.status;
                this.email!.updateValueAndValidity();
                this.invitation!.updateValueAndValidity();
            })
            .finally(() => (this.isSubmitted = false));
    }

    private submitErrorValidator(errorCode: number): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            const isError = this.submitErrorCode === errorCode;
            if (isError) this.submitErrorCode = null;
            return isError ? { submit: { value: control.value } } : null;
        };
    }

    private passwordValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null =>
            this.password!.value !== this.password2!.value
                ? { password: { value: control.value } }
                : null;
    }

    navigateBack() {
        this.upNavService.forceNavigateBack('/public-exercises');
    }
}
