import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent } from './panel/panel.component';
import { RouterModule } from '@angular/router';
import { NavModule } from '../navigation/nav.module';
import { SelectComponent } from './select/select.component';
import { CardModalComponent } from './card-modal/card-modal.component';
import { CollapsibleDirective } from './collapsible/collapsible.directive';

@NgModule({
  imports: [CommonModule, RouterModule, NavModule],
  declarations: [
    PanelComponent,
    SelectComponent,
    CardModalComponent,
    CollapsibleDirective,
  ],
  exports: [
    PanelComponent,
    SelectComponent,
    CardModalComponent,
    CollapsibleDirective,
  ],
})
export class TemplatesModule {}
