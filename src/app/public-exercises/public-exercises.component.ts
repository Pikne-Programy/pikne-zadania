import { Component, OnInit } from '@angular/core';
import { NavService } from '../navigation/navingation.service';

@Component({
  selector: 'app-public-exercises',
  templateUrl: './public-exercises.component.html',
  styleUrls: ['./public-exercises.component.scss', '../app.component.scss'],
})
export class PublicExercisesComponent {
  constructor(private navService: NavService) {}

  toggleSidenav() {
    this.navService.toggleSidenav();
  }
}
