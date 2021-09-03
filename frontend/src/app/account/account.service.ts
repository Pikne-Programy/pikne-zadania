import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as ServerRoutes from '../server-routes';
import { getErrorCode, isObject, pbkdf2, TYPE_ERROR } from '../helper/utils';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ThemeService } from '../helper/theme.service';

export type AccountReturnType = {
    observable: BehaviorSubject<Account | null>;
    error: number | null;
};

export interface Account {
    name: string;
    number: number | null;
    team: number;
}
export function isAccount(object: any): object is Account {
    return isObject<Account>(object, [
        ['name', ['string']],
        ['number', ['number', 'null']],
        ['team', ['number']]
    ]);
}

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    currentAccount = new BehaviorSubject<Account | null>(null);
    constructor(
        private http: HttpClient,
        private themeService: ThemeService,
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
        email = email.toLowerCase();
        username.trim();
        invitation.trim();
        const hashedPassword = await pbkdf2(email, password);
        return this.http
            .post(ServerRoutes.register, {
                login: email,
                name: username,
                hashedPassword,
                number: number !== null ? Number(number) : null,
                invitation
            })
            .toPromise();
    }

    async login(email: string, password: string) {
        email = email.toLowerCase();
        const hashedPassword = await pbkdf2(email, password);
        return this.http
            .post(ServerRoutes.login, {
                login: email,
                hashedPassword
            })
            .toPromise();
    }

    async getAccount(): Promise<AccountReturnType> {
        const account = await this.http
            .post(ServerRoutes.userGet, {})
            .pipe(
                map((response) => {
                    if (isAccount(response)) return response;
                    else return TYPE_ERROR;
                })
            )
            .toPromise()
            .catch((error) => getErrorCode(error, TYPE_ERROR));
        this.currentAccount.next(typeof account !== 'number' ? account : null);

        if (typeof account !== 'number')
            return { observable: this.currentAccount, error: null };
        else return { observable: this.currentAccount, error: account };
    }

    clearAccount() {
        this.currentAccount.next(null);
    }

    logout() {
        this.http
            .post(ServerRoutes.logout, {})
            .toPromise()
            .catch((error) => {
                console.warn('Logout error', error);
            })
            .finally(() => {
                this.themeService.resetTheme();
                this.router.navigate(['./'], {
                    relativeTo: this.route,
                    queryParamsHandling: 'preserve'
                });
                this.clearAccount();
            });
    }
}
