import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProgressSaveGuardService } from '../guards/progress-save-guard.service';
import { NavComponent } from '../navigation/nav.component';
import { SubjectDashboardComponent } from './dashboard/dashboard.component';
import { SubjectPermitComponent } from './dashboard/permit/permit.component';
import { ExerciseCreationComponent } from './exercise-modification/creation/creation.component';
import { ExerciseModificationComponent } from './exercise-modification/modification/modification.component';
import { CategoryModificationComponent } from './hierarchy/category-modification/category-modification.component';
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
                path: 'dashboard/:subjectId/permit',
                component: SubjectPermitComponent,
                canDeactivate: [ProgressSaveGuardService]
            },
            {
                path: 'exercise-edit/:subjectId/:exerciseId',
                component: ExerciseModificationComponent,
                canDeactivate: [ProgressSaveGuardService]
            },
            {
                path: 'exercise-new/:subjectId',
                component: ExerciseCreationComponent,
                canDeactivate: [ProgressSaveGuardService]
            },
            {
                path: 'categories/:subjectId',
                component: HierarchyModificationComponent,
                canDeactivate: [ProgressSaveGuardService]
            },
            {
                path: 'category-edit/:subjectId',
                component: CategoryModificationComponent,
                canDeactivate: [ProgressSaveGuardService]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SubjectRoutingModule {}
