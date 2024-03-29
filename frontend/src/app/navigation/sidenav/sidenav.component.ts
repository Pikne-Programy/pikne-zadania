import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountService } from 'src/app/account/account.service';
import {
    ButtonElement,
    executeButtonClick,
    MenuElement,
    NavService
} from '../services/navigation.service';

@Component({
    selector: 'app-sidenav',
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
    /**
     * First - link; Second - text
     */
    menuElements?: MenuElement[];
    buttonElements?: ButtonElement[];

    private menu$?: Subscription;
    private buttons$?: Subscription;
    constructor(
        private navService: NavService,
        private accountService: AccountService,
        private router: Router
    ) {}

    ngOnInit() {
        this.menu$ = this.navService.menuElements.subscribe((array) => {
            this.menuElements = array;
        });
        this.buttons$ = this.navService.buttonElements.subscribe((array) => {
            this.buttonElements = array;
        });
    }

    /* istanbul ignore next */
    ngOnDestroy() {
        this.menu$?.unsubscribe();
        this.buttons$?.unsubscribe();
    }

    closeSidenav() {
        this.navService.toggleSidenav();
    }

    getQueryParams(menuElement: MenuElement) {
        return menuElement.getQueryParams(this.router.routerState.snapshot.url);
    }

    execute(buttonElement: ButtonElement) {
        executeButtonClick(buttonElement, this.router, this.accountService);
    }
}
