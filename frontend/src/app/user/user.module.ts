import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { UserRoutingModule } from './user-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavModule } from '../navigation/nav.module';
import { UserComponent } from './user.component';
import { TeacherDashboardComponent } from './dashboard/teacher/teacher-dashboard.component';
import { UserDashboardComponent } from './dashboard/user/user-dashboard.component';
import { TemplatesModule } from '../templates/templates.module';
import { TeamsComponent } from './teams/teams.component';
import { TeamItemComponent } from './teams/item/item.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AchievementsComponent } from './achievements/achievements.component';
import { TeamService } from './team.service/team.service';
import { SubjectSelectComponent as ShortcutSubjectSelectComponent } from './dashboard/subject-select/subject-select.component';
import { SubjectService } from '../subjects/subject.service/subject.service';

@NgModule({
    declarations: [
        UserComponent,
        DashboardComponent,
        TeacherDashboardComponent,
        UserDashboardComponent,
        TeamsComponent,
        TeamItemComponent,
        AchievementsComponent,
        ShortcutSubjectSelectComponent
    ],
    imports: [
        CommonModule,
        UserRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        ClipboardModule,
        NavModule,
        TemplatesModule
    ],
    providers: [TeamService, SubjectService],
    bootstrap: [UserComponent]
})
export class UserModule {}
