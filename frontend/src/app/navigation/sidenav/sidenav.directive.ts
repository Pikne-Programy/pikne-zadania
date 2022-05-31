import { AfterViewInit, Directive, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { NavService } from '../services/navigation.service';

@Directive({
    selector: '[appSidenav]'
})
export class SidenavDirective implements AfterViewInit, OnDestroy {
    private opened$?: Subscription;

    constructor(private el: MatSidenav, private navService: NavService) {}

    ngAfterViewInit() {
        this.opened$ = this.navService.sideNavOpened.subscribe({
            next: (v) => {
                if (v) this.el.open();
                else this.el.close();
            }
        });
    }

    ngOnDestroy() {
        this.opened$?.unsubscribe();
    }
}
