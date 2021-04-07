import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';
import { AuthGuardService } from './account/auth-guard.service';
import { NavComponent } from './navigation/nav.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/public-exercises' },
  {
    path: 'public-exercises',
    component: NavComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: SubjectSelectComponent,
      },
      {
        path: 'subjects/:subjectId',
        component: PublicExercisesComponent,
      },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'user',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule),
  },
  {
    path: 'about',
    component: AboutComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
