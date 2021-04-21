import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent } from './panel/panel.component';
import { RouterModule } from '@angular/router';
import { NavModule } from '../navigation/nav.module';
import { SelectComponent } from './select/select.component';

@NgModule({
  imports: [CommonModule, RouterModule, NavModule],
  declarations: [PanelComponent, SelectComponent],
  exports: [PanelComponent, SelectComponent],
})
export class TemplatesModule {}
