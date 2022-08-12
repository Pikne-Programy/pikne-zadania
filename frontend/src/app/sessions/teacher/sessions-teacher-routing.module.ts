import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from '../../navigation/nav.component';
import { SessionTeacherDashboardComponent } from './dashboard/dashboard.component';
import { AddSessionExercisesComponent } from './exercises/exercises.component';
import { ReportsComponent } from './reports/reports.component';

const routes: Routes = [
    {
        path: '',
        component: NavComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: '/user/teams'
            },
            {
                path: ':teamId',
                component: SessionTeacherDashboardComponent
            },
            {
                path: 'add-exercises/:teamId',
                component: AddSessionExercisesComponent
            },
            {
                path: 'reports/:teamId',
                component: ReportsComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SessionsTeacherRoutingModule {}
