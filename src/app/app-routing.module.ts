import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
        outlet: 'content',
      },
      {
        path: 'subjects/:subjectId',
        component: ContentComponent,
        outlet: 'content',
        children: [
          {
            path: 'categories/:categoryIds',
            component: ContentComponent,
            outlet: 'categories',
          },
          {
            path: 'exercises/:exerciseId',
            component: ContentComponent,
            outlet: 'exercise',
            children: [],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
