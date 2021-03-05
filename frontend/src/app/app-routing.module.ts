import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { ContentComponent } from './content/content.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/public-exercises' },
  {
    path: 'public-exercises',
    component: ContentComponent,
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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
