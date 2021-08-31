// Copyright 2021 Miłosz Wąsacz <wasacz.dev@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production)
    enableProdMode();


platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
