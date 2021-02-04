import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicExercisesComponent } from './public-exercises/public-exercises.component';
import { SubjectSelectComponent } from './subject-select/subject-select.component';

const routes: Routes = [
  { path: '', redirectTo: '/public-exercises', pathMatch: 'full' },
  {
    path: 'public-exercises',
    component: PublicExercisesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: SubjectSelectComponent,
        outlet: 'content',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
