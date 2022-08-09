import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from '../../navigation/nav.component';
import { SessionTeacherDashboardComponent } from './dashboard/dashboard.component';

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
                path: 'reports/:teamId'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SessionsTeacherRoutingModule {}
