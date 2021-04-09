import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountService } from 'src/app/account/account.service';
import {
  ButtonElement,
  executeButtonClick,
  NavService,
} from '../services/navigation.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  menuElements = this.navService.getMenuElements();
  buttonElements?: ButtonElement[];

  private buttonsSubscription?: Subscription;
  constructor(
    private navService: NavService,
    private accountService: AccountService,
    private router: Router
  ) {}

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

  execute(buttonElement: ButtonElement) {
    executeButtonClick(buttonElement, this.router, this.accountService);
  }
}