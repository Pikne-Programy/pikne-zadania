import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from '../../navigation/nav.component';

const routes: Routes = [
    {
        path: '',
        component: NavComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'new' //TODO Add selection component
            },
            {
                path: 'new/:teamId'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SessionsTeacherRoutingModule {}
