import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ExerciseService } from '../exercise-service/exercise.service';
import { getErrorCode } from '../helper/utils';
import { EqexComponent } from './eqex/eqex.component';
import {
  Exercise,
  ExerciseType,
  ExerciseComponent as ExerciseComponentType,
  categoryRegex,
} from './exercises';

@Component({
  selector: 'app-exercise',
  templateUrl: './exercise.component.html',
  styleUrls: ['./exercise.component.scss'],
})
export class ExerciseComponent implements OnChanges, OnDestroy {
  isLoading = true;
  errorCode: number | null = null;
  @ViewChild('exContainer', { read: ViewContainerRef })
  container!: ViewContainerRef;
  componentRef?: ComponentRef<ExerciseComponentType>;
  loadingSubscription?: Subscription;
  answerSubscription?: Subscription;

  @Input() subject?: string;
  @Input() exerciseUrl?: string;
  @Output() onAnswerSubmit = new EventEmitter();
  constructor(
    private exerciseService: ExerciseService,
    private factoryResolver: ComponentFactoryResolver
  ) {}

  ngOnChanges() {
    this.componentRef?.destroy();
    this.isLoading = true;
    this.errorCode = null;

    if (this.exerciseUrl && this.subject) {
      this.exerciseService
        .getExercise(this.subject, this.getExerciseId(this.exerciseUrl))
        .then((exercise) => {
          switch (exercise.type) {
            case ExerciseType[ExerciseType.EqEx]:
              this.inflateComponent(EqexComponent, exercise);
              break;
            default:
              this.throwError();
          }
        })
        .catch((error) => this.throwError(error));
    }
  }

  ngOnDestroy() {
    this.componentRef?.destroy();
    this.loadingSubscription?.unsubscribe();
    this.answerSubscription?.unsubscribe();
  }

  private inflateComponent<T extends ExerciseComponentType>(
    type: Type<T>,
    exercise: Exercise
  ) {
    this.loadingSubscription?.unsubscribe();
    this.answerSubscription?.unsubscribe();
    if (this.exerciseUrl) {
      const factory = this.factoryResolver.resolveComponentFactory(type);
      this.container.clear();
      const component = this.container.createComponent(factory);
      this.componentRef = component;
      this.loadingSubscription = component.instance.loaded.subscribe(() => {
        this.isLoading = false;
        this.loadingSubscription?.unsubscribe();
        this.answerSubscription = component.instance.onAnswers.subscribe(
          (error: number | null) => {
            this.errorCode = error;
            this.onAnswerSubmit.emit();
          }
        );
      });
      component.instance.subject = this.subject;
      component.instance.exerciseId = this.getExerciseId(this.exerciseUrl);
      component.instance.data = exercise;
    }
  }

  private throwError(error: any = {}) {
    this.isLoading = false;
    this.errorCode = getErrorCode(error);
  }

  getErrorMessage(errorCode: number): string | undefined {
    switch (errorCode) {
      case 404:
        return 'Ups! Zadanie, którego szukasz, nie istnieje!';
      case 500:
        return 'Błąd serwera';
      default:
        return undefined;
    }
  }

  getErrorCode(errorCode: number): number | undefined {
    switch (errorCode) {
      case 404:
      case 500:
        return undefined;
      default:
        return errorCode;
    }
  }

  private getExerciseId(exercisePath: string) {
    const matches = exercisePath.match(categoryRegex);
    if (matches && matches.length > 0) return matches[matches.length - 1];
    else return '';
  }
}
