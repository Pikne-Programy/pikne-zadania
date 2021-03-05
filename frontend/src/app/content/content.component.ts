import { Component } from '@angular/core';
import { NavService } from '../navigation/navingation.service';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss', '../app.component.scss'],
})
export class ContentComponent {
  constructor(private navService: NavService) {}

  toggleSidenav() {
    this.navService.toggleSidenav();
  }
}
