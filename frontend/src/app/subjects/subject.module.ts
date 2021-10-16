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
import { ExerciseModule } from '../exercises/exercise.module';
import { EditorToolbarComponent } from './exercise-modification/form/editor-toolbar/editor-toolbar.component';
import { SnippetService } from './exercise-modification/form/snippet.service/snippet.service';
import { HierarchyService } from './hierarchy/service/hierarchy.service';
import { HierarchyModificationComponent } from './hierarchy/modification/hierarchy-modification.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FileUploadComponent } from './exercise-modification/form/file-upload/file-upload.component';
import { FileUploadService } from './file-upload.service/file-upload.service';

@NgModule({
    declarations: [
        SubjectComponent,
        SubjectListComponent,
        SubjectDashboardComponent,
        SubjectDashboardPreviewComponent,
        ExerciseModificationComponent,
        ExerciseCreationComponent,
        ExerciseModificationFormComponent,
        EditorToolbarComponent,
        HierarchyModificationComponent,
        FileUploadComponent
    ],
    imports: [
        CommonModule,
        SubjectRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        NavModule,
        TemplatesModule,
        ExerciseModule,
        MatAutocompleteModule,
        DragDropModule
    ],
    providers: [
        ExerciseModificationService,
        SnippetService,
        HierarchyService,
        FileUploadService
    ],
    bootstrap: [SubjectComponent]
})
export class SubjectModule {}
