import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import { NavComponent } from '../navigation/nav.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TeamItemComponent } from './teams/item/item.component';
import { TeamsComponent } from './teams/teams.component';

const TeacherRoles = [Role.TEACHER, Role.ADMIN];

const routes: Routes = [
  {
    path: '',
    component: NavComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'teams',
        component: TeamsComponent,
        canActivate: [RoleGuardService],
        data: { roles: TeacherRoles },
      },
      {
        path: 'teams/:teamId',
        component: TeamItemComponent,
        canActivate: [RoleGuardService],
        data: { roles: TeacherRoles },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
