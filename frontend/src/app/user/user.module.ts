import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
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
import { RoleGuardService } from '../guards/role-guard.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AchievementsComponent } from './achievements/achievements.component';
import { TeamService } from './team.service/team.service';

@NgModule({
  declarations: [
    UserComponent,
    DashboardComponent,
    TeacherDashboardComponent,
    UserDashboardComponent,
    TeamsComponent,
    TeamItemComponent,
    AchievementsComponent,
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    NavModule,
    MatSidenavModule,
    TemplatesModule,
  ],
  providers: [RoleGuardService, TeamService],
  bootstrap: [UserComponent],
})
export class UserModule {}
