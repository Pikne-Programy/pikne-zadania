import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubjectRoutingModule } from './subject-routing.module';
import { SubjectComponent } from './subject.component';
import { SubjectListComponent } from './list/list.component';
import { NavModule } from '../navigation/nav.module';
import { TemplatesModule } from '../templates/templates.module';
import { SubjectDashboardComponent } from './dashboard/dashboard.component';
import { SubjectDashboardPreviewComponent } from './dashboard/exercise-previews/preview.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExerciseModificationService } from './exercise-modification/service/exercise-modification.service';
import { ExerciseModificationComponent } from './exercise-modification/modification/modification.component';
import { ExerciseModificationFormComponent } from './exercise-modification/form/form.component';
import { ExerciseCreationComponent } from './exercise-modification/creation/creation.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [
    SubjectComponent,
    SubjectListComponent,
    SubjectDashboardComponent,
    SubjectDashboardPreviewComponent,
    ExerciseModificationComponent,
    ExerciseCreationComponent,
    ExerciseModificationFormComponent,
  ],
  imports: [
    CommonModule,
    SubjectRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NavModule,
    TemplatesModule,
    MatAutocompleteModule,
  ],
  providers: [ExerciseModificationService],
  bootstrap: [SubjectComponent],
})
export class SubjectModule {}
