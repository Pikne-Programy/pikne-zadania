import { Component } from '@angular/core';
import { Theme, ThemeService } from 'src/app/helper/theme.service';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
})
export class AchievementsComponent {
  constructor(private themeService: ThemeService) {}

  setTheme(name: Theme) {
    this.themeService.setTheme(name);
  }
}
