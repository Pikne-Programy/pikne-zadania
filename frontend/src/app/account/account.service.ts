import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import * as ServerRoutes from '../server-routes';
import { pbkdf2 } from '../helper/utils';
import { BehaviorSubject, Subscription } from 'rxjs';

export interface Account {
  name: string;
  number: number | null;
}
export function isAccount(object: any): object is Account {
  return typeof object === 'object' && 'name' in object && 'number' in object;
}

@Injectable({
  providedIn: 'root',
})
export class AccountService implements OnDestroy {
  readonly emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  readonly accountTypeError = 400;

  private currentAccount = new BehaviorSubject<Account | number | null>(null);

  private accountSubscription?: Subscription;
  constructor(private http: HttpClient) {}

  async createAccount(
    email: string,
    username: string,
    password: string,
    invitation: string,
    number: string | null
  ) {
    username.trim();
    invitation.trim();
    const hashedPassword = await pbkdf2(email, password);
    return this.http.post(ServerRoutes.register, {
      login: email,
      name: username,
      hashed_password: hashedPassword,
      number: number !== null ? Number(number) : null,
      invitation: invitation,
    });
  }

  async login(email: string, password: string) {
    const hashedPassword = await pbkdf2(email, password);
    return this.http.post(ServerRoutes.login, {
      login: email,
      hashed_password: hashedPassword,
    });
  }

  getAccount() {
    this.accountSubscription?.unsubscribe();
    this.accountSubscription = this.http.get(ServerRoutes.account).subscribe(
      (response) => {
        this.currentAccount.next(
          isAccount(response) || typeof response === 'number'
            ? response
            : this.accountTypeError
        );
      },
      (error) => {
        this.currentAccount.next(error.status);
      }
    );
    return this.currentAccount;
  }

  getCurrentAccount() {
    return this.currentAccount.getValue();
  }

  clearCurrentAccount() {
    this.currentAccount.next(null);
  }

  ngOnDestroy() {
    this.accountSubscription?.unsubscribe();
    this.currentAccount.complete();
  }
}
