import { Component, Input, OnInit } from '@angular/core';
import { Tuple } from 'src/app/helper/utils';
import {
  buttonElements,
  menuElements,
  NavService,
} from '../navingation.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  sideNavOpened: boolean = false;
  showTabs: boolean = false;
  menuElements: Tuple<string, string, null>[];
  buttonElements: Tuple<string, string, string>[];

  constructor(private navService: NavService) {
    this.menuElements = menuElements;
    this.buttonElements = buttonElements;
  }

  ngOnInit() {
    this.navService.sideNavOpened.subscribe((val) => {
      this.sideNavOpened = val;
    });
  }

  toggleNavbar() {
    this.navService.toggleSidenav();
  }
}
