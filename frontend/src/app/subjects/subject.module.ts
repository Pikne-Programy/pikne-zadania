import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubjectRoutingModule } from './subject-routing.module';
import { SubjectComponent } from './subject.component';
import { SubjectListComponent } from './list/list.component';
import { NavModule } from '../navigation/nav.module';
import { SubjectService } from './subject.service/subject.service';
import { TemplatesModule } from '../templates/templates.module';

@NgModule({
  declarations: [SubjectComponent, SubjectListComponent],
  imports: [CommonModule, SubjectRoutingModule, NavModule, TemplatesModule],
  providers: [SubjectService],
  bootstrap: [SubjectComponent],
})
export class SubjectModule {}
