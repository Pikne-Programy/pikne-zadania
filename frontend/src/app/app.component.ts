import { Component } from '@angular/core';
import { startServer } from './helper/tests/server';
import { serverMockEnabled } from './helper/tests/tests.config';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'Niedostateczny';

    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (serverMockEnabled) startServer();
    }
}
