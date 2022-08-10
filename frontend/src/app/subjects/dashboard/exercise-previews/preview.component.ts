import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { Router } from '@angular/router';
import { ExerciseType } from 'src/app/exercise-service/exercises';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { removeMathTabIndex } from 'src/app/helper/utils';
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let MathJax: any;

export interface ViewExercise {
    id: string;
    type: ExerciseType;
    name: string;
    desc?: string;
}

type PreviewRole = 'edit' | 'add' | 'added' | 'none';

@Component({
    selector: 'app-subject-ex-prev',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss', '../dashboard.component.scss']
})
export class SubjectDashboardPreviewComponent implements AfterViewInit {
    @Input() exercise!: ViewExercise;
    @Input() subjectId!: string;
    @Input() isLast?: boolean;
    @Input() icon: PreviewRole = 'edit';
    /** Number of lines after which rest of the text will be hidden (min 1, max 5) */
    @Input() ellipsisLines = 2;
    @Output() ready = new EventEmitter();
    /** First - subjectId; Second - exercise */
    @Output() itemClick = new EventEmitter<[string, ViewExercise]>();

    constructor(private router: Router) {}

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

    getIconTitle(): string {
        switch (this.icon) {
            case 'edit':
                return 'Edytuj zadanie';
            case 'add':
                return 'Dodaj zadanie do testu';
            case 'added':
                return 'Dodano zadanie do testu';
            case 'none':
                return '';
        }
    }

    onIconClick() {
        switch (this.icon) {
            case 'edit':
                this.router.navigate([
                    '/subject/exercise-edit',
                    this.subjectId,
                    this.exercise.id
                ]);
                break;
            case 'add':
            case 'added':
                this.itemClick.emit([this.subjectId, this.exercise]);
                break;
            case 'none':
                break;
        }
    }

    get lineCountClass(): string {
        let lines = this.ellipsisLines;
        if (lines < 1) lines = 1;
        else if (lines > 5) lines = 5;
        return `lines-${lines}`;
    }

    async setMath() {
        await setAsyncTimeout(50);
        return MathJax.typesetPromise().then(() => {
            removeMathTabIndex();
        });
    }
}
