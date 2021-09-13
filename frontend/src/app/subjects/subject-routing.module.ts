import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavComponent } from '../navigation/nav.component';
import { SubjectDashboardComponent } from './dashboard/dashboard.component';
import { ExerciseCreationComponent } from './exercise-modification/creation/creation.component';
import { ExerciseModificationComponent } from './exercise-modification/modification/modification.component';
import { HierarchyModificationComponent } from './hierarchy/modification/hierarchy-modification.component';
import { SubjectListComponent } from './list/list.component';

const routes: Routes = [
    {
        path: '',
        component: NavComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'list'
            },
            {
                path: 'list',
                component: SubjectListComponent
            },
            {
                path: 'dashboard/:subjectId',
                component: SubjectDashboardComponent
            },
            {
                path: 'exercise-edit/:subjectId/:exerciseId',
                component: ExerciseModificationComponent
            },
            {
                path: 'exercise-new/:subjectId',
                component: ExerciseCreationComponent
            },
            {
                path: 'categories/:subjectId',
                component: HierarchyModificationComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SubjectRoutingModule {}
