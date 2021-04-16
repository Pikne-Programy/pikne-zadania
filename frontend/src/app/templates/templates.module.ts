import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent } from './panel/panel.component';
import { RouterModule } from '@angular/router';
import { NavModule } from '../navigation/nav.module';

@NgModule({
  imports: [CommonModule, RouterModule, NavModule],
  declarations: [PanelComponent],
  exports: [PanelComponent],
})
export class TemplatesModule {}
