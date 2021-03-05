import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
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
  submitErrorCode: number | null = null;
  constructor(private accountService: AccountService) {}

  submit() {
    this.submitErrorCode = null;
  }

  ngOnDestroy() {
    this.submitSubscription?.unsubscribe();
  }
}
