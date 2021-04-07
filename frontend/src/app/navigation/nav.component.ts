import { Component } from '@angular/core';
import { NavService } from './services/navigation.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  constructor(private navService: NavService) {}

  toggleSidenav() {
    this.navService.toggleSidenav();
  }
}
