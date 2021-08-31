// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, ViewEncapsulation } from '@angular/core';
import { UpNavService } from '../navigation/services/up-navigation.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AboutComponent {
    constructor(private upNavService: UpNavService) {}

    back() {
        this.upNavService.navigateBack();
    }
}
