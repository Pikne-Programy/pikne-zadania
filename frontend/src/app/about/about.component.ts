import { Component, ViewEncapsulation } from '@angular/core';
import { UpNavService } from '../navigation/up-navigation.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AboutComponent {
  constructor(private upNavService: UpNavService) {}

  back() {
    this.upNavService.back();
  }
}
