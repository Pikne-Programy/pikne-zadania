import { Component } from '@angular/core';
import { startServer } from './helper/tests/server';
import { serverMockEnabled } from './helper/tests/tests.config';
import { UpNavService } from './navigation/services/up-navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Niedostateczny';

  constructor(private upNavService: UpNavService) {
    if (serverMockEnabled) startServer();
  }
}
