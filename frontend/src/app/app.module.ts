import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AboutComponent } from './about/about.component';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { TabComponent } from './navigation/tabs/tab.component';
import { SidenavComponent } from './navigation/sidenav/sidenav.component';
import { SidenavDirective } from './navigation/sidenav/sidenav.directive';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';
import { ContentComponent } from './content/content.component';
import { ExerciseComponent } from './exercises/exercise.component';
import { EqexComponent } from './exercises/eqex/eqex.component';
import { RegisterComponent } from './account/register/register.component';
import { LoginComponent } from './account/login/login.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SidenavComponent,
    SidenavDirective,
    TabComponent,
    PublicExercisesComponent,
    SubjectSelectComponent,
    ContentComponent,
    ExerciseComponent,
    EqexComponent,
    RegisterComponent,
    LoginComponent,
    AboutComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    FormsModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
