import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Tuple } from 'src/app/helper/utils';
import { menuElements, NavService } from '../navingation.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  menuElements: Tuple<string, string, null>[];
  buttonElements?: Tuple<string | Function, string, string>[];

  private buttonsSubscription?: Subscription;
  constructor(private navService: NavService, private router: Router) {
    this.menuElements = menuElements;
  }

  ngOnInit() {
    this.buttonsSubscription = this.navService.buttonElements.subscribe(
      (array) => {
        this.buttonElements = array;
      }
    );
  }

  ngOnDestroy() {
    this.buttonsSubscription?.unsubscribe();
  }

  closeSidenav() {
    this.navService.toggleSidenav();
  }

  checkLink(link: string | Function): string | undefined {
    return typeof link === 'string' ? link : undefined;
  }
  execute(link: string | Function) {
    if (typeof link === 'function') link(this.navService, this.router);
  }
}
