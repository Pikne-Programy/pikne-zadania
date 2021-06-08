import { Component } from '@angular/core';
import { AccountService } from '../account/account.service';
import { NavService } from './services/navigation.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  isLoginWarningShown = false;

  constructor(private navService: NavService, accountService: AccountService) {
    accountService.getAccount().then((val) => {
      if (!val.observable.getValue()) this.isLoginWarningShown = true;
    });
  }

  toggleSidenav() {
    this.navService.toggleSidenav();
  }
}
