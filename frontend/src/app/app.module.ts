import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppRoutingModule } from './app-routing.module';
import { NavModule } from './navigation/nav.module';
import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';
import { RegisterComponent } from './account/register/register.component';
import { LoginComponent } from './account/login/login.component';
import { environment } from '../environments/environment';
import { TemplatesModule } from './templates/templates.module';
import { AuthGuardService } from './guards/auth-guard.service';
import { AccountService } from './account/account.service';
import { NavService } from './navigation/services/navigation.service';
import { UpNavService } from './navigation/services/up-navigation.service';
import { ThemeService } from './helper/theme.service';
import { ExerciseService } from './exercise-service/exercise.service';
import { ScreenSizeService } from './helper/screen-size.service';
import { RoleGuardService } from './guards/role-guard.service';
import { SubjectService } from './subjects/subject.service/subject.service';
import { ExerciseModule } from './exercises/exercise.module';
import { ProgressSaveGuardService } from './guards/progress-save-guard.service';
import { ImagePreviewService } from './templates/image-preview/service/image-preview.service';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

@NgModule({
    declarations: [
        AppComponent,
        PublicExercisesComponent,
        SubjectSelectComponent,
        RegisterComponent,
        LoginComponent,
        AboutComponent,
        PageNotFoundComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NavModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        ExerciseModule,
        TemplatesModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production
        })
    ],
    providers: [
        AccountService,
        SubjectService,
        ExerciseService,
        NavService,
        UpNavService,
        AuthGuardService,
        RoleGuardService,
        ProgressSaveGuardService,
        ScreenSizeService,
        ThemeService,
        ImagePreviewService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
