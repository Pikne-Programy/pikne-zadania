import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent } from './panel/panel.component';
import { RouterModule } from '@angular/router';
import { NavModule } from '../navigation/nav.module';
import { SelectComponent } from './select/select.component';
import { CardModalComponent } from './card-modal/card-modal.component';
import { CollapsibleDirective } from './collapsible/collapsible.directive';
import { ImagePlaceholderComponent } from './image-placeholder/image-placeholder.component';
import { HighlightTextareaComponent } from './highlight-textarea/highlight-textarea.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SafeHtmlPipe } from './highlight-textarea/safe-html.pipe';
import { SwitchComponent } from './switch/switch.component';
import { UnsavedChangesModalComponent } from './unsaved-changes-modal/unsaved-changes-modal.component';
import { ImagePreviewComponent } from './image-preview/image-preview.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NavModule,
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [
        PanelComponent,
        SelectComponent,
        CardModalComponent,
        ImagePlaceholderComponent,
        CollapsibleDirective,
        HighlightTextareaComponent,
        SafeHtmlPipe,
        SwitchComponent,
        UnsavedChangesModalComponent,
        ImagePreviewComponent
    ],
    exports: [
        PanelComponent,
        SelectComponent,
        CardModalComponent,
        ImagePlaceholderComponent,
        CollapsibleDirective,
        HighlightTextareaComponent,
        SwitchComponent,
        UnsavedChangesModalComponent,
        ImagePreviewComponent
    ]
})
export class TemplatesModule {}
