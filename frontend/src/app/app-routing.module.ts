import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';
import { NavComponent } from './navigation/nav.component';
import { AuthGuardService } from './guards/auth-guard.service';
import { RoleGuardService, TEACHER_ROLES } from './guards/role-guard.service';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: '/public-exercises' },
    {
        path: 'public-exercises',
        component: NavComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: SubjectSelectComponent
            },
            {
                path: 'subjects/:subjectId',
                component: PublicExercisesComponent
            }
        ]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'user',
        canActivate: [AuthGuardService],
        loadChildren: () => import('./user/user.module').then((m) => m.UserModule)
    },
    {
        path: 'subject',
        canActivate: [RoleGuardService],
        data: { roles: TEACHER_ROLES },
        loadChildren: () =>
            import('./subjects/subject.module').then((m) => m.SubjectModule)
    },
    {
        path: 'about',
        component: AboutComponent
    },
    {
        path: '**',
        redirectTo: '/page-not-found'
    },
    {
        path: 'page-not-found',
        component: NavComponent,
        children: [
            {
                path: '',
                component: PageNotFoundComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
