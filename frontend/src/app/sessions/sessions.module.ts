import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsComponent } from './sessions.component';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [SessionsComponent],
    imports: [CommonModule, RouterModule],
    exports: [SessionsComponent]
})
export class SessionsModule {}
