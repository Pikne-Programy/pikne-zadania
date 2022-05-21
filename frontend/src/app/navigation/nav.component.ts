import { Component } from '@angular/core';
import { AccountService } from '../account/account.service';
import { NavService } from './services/navigation.service';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss']
})
export class NavComponent {
    private cookiesKey = 'COOKIES_STATUS';

    isLoginWarningShown = false;
    isCookiesNotificationShown = false;

    constructor(
        private navService: NavService,
        accountService: AccountService
    ) {
        accountService.getAccount().then((val) => {
            if (!val.observable.getValue()) this.isLoginWarningShown = true;
        });
        this.getCookiesStatus();
    }

    toggleSidenav() {
        this.navService.toggleSidenav();
    }

    private getCookiesStatus() {
        this.isCookiesNotificationShown =
            localStorage.getItem(this.cookiesKey) !== 'true';
    }

    acceptCookies() {
        this.isCookiesNotificationShown = false;
        localStorage.setItem(this.cookiesKey, 'true');
    }
}
