import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavModule } from '../navigation/nav.module';
import { EqExComponent } from './eqex/eqex.component';
import { ExerciseComponent } from './exercise.component';
import { ExerciseInflationService } from './inflation.service/inflation.service';

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NavModule],
    declarations: [ExerciseComponent, EqExComponent],
    exports: [ExerciseComponent],
    providers: [ExerciseInflationService]
})
export class ExerciseModule {}
