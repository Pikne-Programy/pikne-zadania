import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { TabComponent } from './navigation/tabs/tab.component';
import { SidenavComponent } from './navigation/sidenav/sidenav.component';
import { SidenavDirective } from './navigation/sidenav/sidenav.directive';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SidenavComponent,
    SidenavDirective,
    TabComponent,
    PublicExercisesComponent,
    SubjectSelectComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
