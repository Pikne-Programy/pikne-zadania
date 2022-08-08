import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsTeacherRoutingModule } from './sessions-teacher-routing.module';
import { NavModule } from 'src/app/navigation/nav.module';
import { TemplatesModule } from 'src/app/templates/templates.module';
import { SessionsComponent } from '../sessions.component';
import { SessionsModule } from '../sessions.module';

@NgModule({
    imports: [
        CommonModule,
        SessionsModule,
        SessionsTeacherRoutingModule,
        NavModule,
        TemplatesModule
    ],
    bootstrap: [SessionsComponent]
})
export class SessionsTeacherModule {}
