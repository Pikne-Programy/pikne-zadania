import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as ServerRoutes from '../server-routes';
import { pbkdf2 } from '../helper/utils';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';

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
export class AccountService {
  readonly accountTypeError = 400;

  currentAccount = new BehaviorSubject<Account | null>(null);
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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

  async getAccount(): Promise<{
    observable: BehaviorSubject<Account | null>;
    error: number | null;
  }> {
    const account = await this.http
      .get(ServerRoutes.account)
      .pipe(
        map((response) => {
          if (response && isAccount(response)) return response;
          else return this.accountTypeError;
        })
      )
      .toPromise()
      .catch((error) => {
        return error.status && typeof error.status === 'number'
          ? (error.status as number)
          : this.accountTypeError;
      });
    this.currentAccount.next(typeof account !== 'number' ? account : null);

    if (typeof account !== 'number')
      return { observable: this.currentAccount, error: null };
    else return { observable: this.currentAccount, error: account };
  }

  clearAccount() {
    this.currentAccount.next(null);
  }

  logout() {
    this.clearAccount();
    this.http
      .post(ServerRoutes.logout, {})
      .toPromise()
      .catch((error) => {
        console.warn('Logout error', error);
      })
      .finally(() => {
        this.router.navigate(['./'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
        });
      });
  }
}
