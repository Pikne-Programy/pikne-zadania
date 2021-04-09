import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';

import { UserRoutingModule } from './user-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavModule } from '../navigation/nav.module';
import { UserComponent } from './user.component';
import { TeacherDashboardComponent } from './dashboard/teacher/teacher-dashboard.component';
import { UserDashboardComponent } from './dashboard/user/user-dashboard.component';

@NgModule({
  declarations: [
    UserComponent,
    DashboardComponent,
    TeacherDashboardComponent,
    UserDashboardComponent,
  ],
  imports: [CommonModule, UserRoutingModule, NavModule, MatSidenavModule],
  providers: [],
  bootstrap: [UserComponent],
})
export class UserModule {}
