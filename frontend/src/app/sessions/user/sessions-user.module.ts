import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsUserRoutingModule } from './sessions-user-routing.module';
import { NavModule } from 'src/app/navigation/nav.module';
import { TemplatesModule } from 'src/app/templates/templates.module';
import { SessionsComponent } from '../sessions.component';
import { SessionsModule } from '../sessions.module';
import { SessionUserDashboardComponent } from './dashboard/dashboard.component';
import { ExerciseModule } from 'src/app/exercises/exercise.module';
import { UserSessionService } from '../services/user-session.service';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';

@NgModule({
    declarations: [SessionUserDashboardComponent],
    imports: [
        CommonModule,
        SessionsModule,
        SessionsUserRoutingModule,
        NavModule,
        TemplatesModule,
        ExerciseModule
    ],
    providers: [UserSessionService, ExerciseService],
    bootstrap: [SessionsComponent]
})
export class SessionsUserModule {}
