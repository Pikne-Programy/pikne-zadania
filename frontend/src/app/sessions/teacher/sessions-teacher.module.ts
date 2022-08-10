import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsTeacherRoutingModule } from './sessions-teacher-routing.module';
import { NavModule } from 'src/app/navigation/nav.module';
import { TemplatesModule } from 'src/app/templates/templates.module';
import { SessionsComponent } from '../sessions.component';
import { SessionsModule } from '../sessions.module';
import { SessionTeacherDashboardComponent } from './dashboard/dashboard.component';
import { SessionService } from '../services/session.service';
import { SubjectModule } from 'src/app/subjects/subject.module';
import { AddSessionExercisesComponent } from './exercises/exercises.component';
import { SubjectService } from 'src/app/subjects/subject.service/subject.service';

@NgModule({
    declarations: [
        SessionTeacherDashboardComponent,
        AddSessionExercisesComponent
    ],
    imports: [
        CommonModule,
        SessionsModule,
        SessionsTeacherRoutingModule,
        NavModule,
        TemplatesModule,
        SubjectModule
    ],
    providers: [SessionService, SubjectService],
    bootstrap: [SessionsComponent]
})
export class SessionsTeacherModule {}
