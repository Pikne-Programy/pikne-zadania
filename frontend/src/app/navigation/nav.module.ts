import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from './nav.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { SidenavDirective } from './sidenav/sidenav.directive';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from './loading/loading.component';
import { ErrorComponent } from './error/error.component';

@NgModule({
    imports: [CommonModule, MatSidenavModule, RouterModule],
    declarations: [
        NavComponent,
        NavbarComponent,
        SidenavComponent,
        SidenavDirective,
        LoadingComponent,
        ErrorComponent
    ],
    exports: [NavComponent, LoadingComponent, ErrorComponent],
    bootstrap: [NavComponent]
})
export class NavModule {}
