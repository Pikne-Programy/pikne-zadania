import {
    AfterViewInit,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    QueryList,
    Type,
    ViewChildren,
    ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { getErrorCode } from '../helper/utils';
import { EqExComponent } from './eqex/eqex.component';
import { Exercise, EqEx } from '../exercise-service/exercises';
import {
    ExerciseComponentType,
    ExerciseInflationService,
    SubmitButtonState
} from './inflation.service/inflation.service';

@Component({
    selector: 'app-exercise',
    templateUrl: './exercise.component.html',
    styleUrls: ['./exercise.component.scss']
})
export class ExerciseComponent implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChildren('exContainer', { read: ViewContainerRef })
    containers!: QueryList<ViewContainerRef>;
    componentRef?: ComponentRef<ExerciseComponentType>;
    container$?: Subscription;
    loading$?: Subscription;
    submitState$?: Subscription;

    @Input() exercise!: Exercise;
    @Input() hasSubmitButton?: boolean = true;
    @Input() specialErrorMessage?: string;
    @Output() onAnswers = new EventEmitter();
    @Output() onLoaded = new EventEmitter();

    errorCode: number | null = null;
    isLoading = true;
    submitState: SubmitButtonState = 'disabled';
    constructor(
        private factoryResolver: ComponentFactoryResolver,
        public inflationService: ExerciseInflationService
    ) {}

    ngAfterViewInit() {
        if (this.containers.length > 0)
            this.addComponent(this.containers.first);
        else {
            this.container$ = this.containers.changes.subscribe((container) => {
                this.addComponent(container);
                this.container$?.unsubscribe();
            });
        }
    }

    ngOnChanges() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.containers?.first) this.addComponent(this.containers.first);
    }

    ngOnDestroy() {
        this.container$?.unsubscribe();
        this.onDestroy();
    }

    private addComponent(container: ViewContainerRef) {
        this.isLoading = true;
        setTimeout(() => {
            this.onDestroy();
            this.errorCode = null;
            switch (this.exercise.type) {
                case 'EqEx':
                    if (EqEx.isEqEx(this.exercise)) {
                        this.inflateComponent(
                            EqExComponent,
                            this.exercise,
                            container
                        );
                    }
                    else this.throwError();
                    break;
                default:
                    this.throwError();
            }
        }, 20);
    }

    private inflateComponent<
        T extends ExerciseComponentType,
        E extends Exercise
    >(type: Type<T>, exercise: E, container: ViewContainerRef) {
        this.inflationService.setExercise(exercise);
        const factory = this.factoryResolver.resolveComponentFactory(type);
        container.clear();
        const component = container.createComponent(factory);
        this.componentRef = component;
        this.loading$ = component.instance.loaded.subscribe((error) => {
            if (this.errorCode === null) this.errorCode = error;
            this.isLoading = false;
            this.onLoaded.emit();
            this.loading$?.unsubscribe();
        });
        this.submitState$ = component.instance.submitButtonState.subscribe(
            (state) => {
                this.submitState = state;
            }
        );
    }

    submitAnswers(component: ComponentRef<ExerciseComponentType>) {
        component.instance
            .submitAnswers()
            .then(() => this.onAnswers.emit())
            .catch((error) => this.throwError(error));
    }

    private throwError(error: any = {}) {
        this.isLoading = false;
        this.onLoaded.emit();
        this.errorCode = getErrorCode(error);
    }

    getErrorMessage(errorCode: number): string | undefined {
        if (this.specialErrorMessage) return this.specialErrorMessage;
        switch (errorCode) {
            case 404:
                return 'Ups! Zadanie, którego szukasz, nie istnieje!';
            case 500:
                return 'Błąd serwera';
            default:
                return undefined;
        }
    }

    private onDestroy() {
        this.componentRef?.destroy();
        this.inflationService.resetExercise();
        this.loading$?.unsubscribe();
        this.submitState$?.unsubscribe();
    }
}
