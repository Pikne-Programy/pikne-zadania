import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuardService, TEACHER_ROLES } from '../guards/role-guard.service';
import { NavComponent } from '../navigation/nav.component';
import { AchievementsComponent } from './achievements/achievements.component';
// import { DashboardComponent } from './dashboard/dashboard.component';
// import { SubjectSelectComponent } from './dashboard/subject-select/subject-select.component';
import { TeamItemComponent } from './teams/item/item.component';
import { TeamsComponent } from './teams/teams.component';

const routes: Routes = [
    {
        path: '',
        component: NavComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                // redirectTo: 'dashboard'
                redirectTo: 'teams'
            },
            /* {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'subject-select/:newLink',
                component: SubjectSelectComponent
            }, */
            {
                path: 'teams',
                component: TeamsComponent,
                canActivate: [RoleGuardService],
                data: { roles: TEACHER_ROLES }
            },
            {
                path: 'teams/:teamId',
                component: TeamItemComponent,
                canActivate: [RoleGuardService],
                data: { roles: TEACHER_ROLES }
            },
            {
                path: 'achievements',
                component: AchievementsComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserRoutingModule {}
