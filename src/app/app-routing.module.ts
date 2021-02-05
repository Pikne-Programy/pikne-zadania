import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExerciseComponent } from './exercises/exercise.component';
import { ContentComponent } from './public-exercises/content/content.component';
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
      },
      {
        path: 'subjects/:subjectIndex/:subjectId',
        component: ContentComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
