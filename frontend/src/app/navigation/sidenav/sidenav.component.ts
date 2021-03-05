import { Component } from '@angular/core';
import { Tuple } from 'src/app/helper/utils';
import {
  NavService,
  menuElements,
  buttonElements,
} from '../navingation.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  menuElements: Tuple<string, string, null>[];
  buttonElements: Tuple<string, string, string>[];

  constructor(private navService: NavService) {
    this.menuElements = menuElements;
    this.buttonElements = buttonElements;
  }

  closeSidenav() {
    this.navService.toggleSidenav();
  }
}
