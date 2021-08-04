import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubjectRoutingModule } from './subject-routing.module';
import { SubjectComponent } from './subject.component';
import { SubjectListComponent } from './list/list.component';
import { NavModule } from '../navigation/nav.module';
import { SubjectService } from './subject.service/subject.service';
import { TemplatesModule } from '../templates/templates.module';
import { SubjectDashboardComponent } from './dashboard/dashboard.component';
import { SubjectDashboardPreviewComponent } from './dashboard/exercise-previews/preview.component';
import { EqexPreviewComponent } from './dashboard/exercise-previews/eqex/eqex.component';

@NgModule({
  declarations: [
    SubjectComponent,
    SubjectListComponent,
    SubjectDashboardComponent,
    SubjectDashboardPreviewComponent,
    EqexPreviewComponent,
  ],
  imports: [CommonModule, SubjectRoutingModule, NavModule, TemplatesModule],
  providers: [SubjectService],
  bootstrap: [SubjectComponent],
})
export class SubjectModule {}
