import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ExerciseType } from 'src/app/exercise-service/exercises';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { removeMathTabIndex } from 'src/app/helper/utils';
declare var MathJax: any;

export interface ViewExercise {
  id: string;
  type: ExerciseType;
  name: string;
  desc?: string;
}

@Component({
  selector: 'app-subject-ex-prev',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss', '../dashboard.component.scss'],
})
export class SubjectDashboardPreviewComponent implements AfterViewInit {
  @Input() exercise!: ViewExercise;
  @Input() subjectId!: string;
  @Input() isLast?: boolean;
  @Output() ready = new EventEmitter();

  constructor() {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.isLast) {
        switch (this.exercise.type) {
          case 'EqEx':
            this.setMath().finally(() => this.ready.emit());
            break;
          default:
            this.ready.emit();
            break;
        }
      }
    }, 10);
  }

  async setMath() {
    await setAsyncTimeout(50);
    return MathJax.typesetPromise().then(() => {
      removeMathTabIndex();
    });
  }
}
