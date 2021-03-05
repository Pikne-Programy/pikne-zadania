import { AfterViewInit, Directive, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { NavService } from '../navingation.service';

@Directive({
  selector: '[appSidenav]',
})
export class SidenavDirective implements AfterViewInit, OnDestroy {
  private openedSub?: Subscription;

  constructor(private el: MatSidenav, private navService: NavService) {}

  ngAfterViewInit() {
    this.openedSub = this.navService.sideNavOpened.subscribe({
      next: (v) => {
        if (v) this.el.open();
        else this.el.close();
      },
    });
  }

  ngOnDestroy() {
    this.openedSub?.unsubscribe();
  }
}
