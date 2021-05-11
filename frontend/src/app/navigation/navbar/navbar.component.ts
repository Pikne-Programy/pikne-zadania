import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountService } from 'src/app/account/account.service';
import { Pair } from 'src/app/helper/utils';
import {
  ButtonElement,
  executeButtonClick,
  NavService,
} from '../services/navigation.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  sideNavOpened: boolean = false;
  showTabs: boolean = false;
  menuElements?: Pair<string, string>[];
  buttonElements?: ButtonElement[];

  private opened$?: Subscription;
  private menu$?: Subscription;
  private buttons$?: Subscription;
  constructor(
    private navService: NavService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.opened$ = this.navService.sideNavOpened.subscribe((val) => {
      this.sideNavOpened = val;
    });
    this.menu$ = this.navService.menuElements.subscribe((array) => {
      this.menuElements = array;
    });
    this.buttons$ = this.navService.buttonElements.subscribe((array) => {
      this.buttonElements = array;
    });
  }

  ngOnDestroy() {
    this.opened$?.unsubscribe();
    this.menu$?.unsubscribe();
    this.buttons$?.unsubscribe();
  }

  toggleNavbar() {
    this.navService.toggleSidenav();
  }

  execute(buttonElement: ButtonElement) {
    executeButtonClick(buttonElement, this.router, this.accountService);
  }
}
