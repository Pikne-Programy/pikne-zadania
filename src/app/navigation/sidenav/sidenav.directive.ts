import { AfterViewInit, Directive, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavService } from '../navingation.service';

@Directive({
  selector: '[appSidenav]',
})
export class SidenavDirective implements AfterViewInit, OnDestroy {
  constructor(private el: MatSidenav, private navService: NavService) {}

  ngAfterViewInit() {
    this.navService.sideNavOpened.subscribe({
      next: (v) => {
        if (v) this.el.open();
        else this.el.close();
      },
    });
  }

  ngOnDestroy() {
    this.navService.sideNavOpened.unsubscribe();
  }
}
