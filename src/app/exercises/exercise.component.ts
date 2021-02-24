import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnChanges,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ExerciseService } from '../exercise-service/exercise.service';
import { EqexComponent } from './eqex/eqex.component';
import {
  Exercise,
  ExerciseType,
  isExercise,
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
  isError = false;
  exercise?: Subscription;
  @ViewChild('exContainer', { read: ViewContainerRef })
  container!: ViewContainerRef;
  componentRef?: ComponentRef<ExerciseComponentType>;
  loadingSubscription?: Subscription;

  @Input() subject?: string;
  @Input() exerciseUrl?: string;
  constructor(
    private exerciseService: ExerciseService,
    private factoryResolver: ComponentFactoryResolver
  ) {}

  ngOnChanges() {
    this.exercise?.unsubscribe();
    this.componentRef?.destroy();
    this.isLoading = true;
    this.isError = false;

    if (this.exerciseUrl && this.subject) {
      this.exercise = this.exerciseService
        .getExercise(this.subject, this.getExerciseId(this.exerciseUrl))
        .subscribe(
          (response) => {
            if (isExercise(response)) {
              switch (response.type) {
                case ExerciseType[ExerciseType.EqEx]:
                  this.inflateComponent(EqexComponent, response);
                  break;
                default:
                  this.throwError({ status: null });
              }
            } else this.throwError({ status: null });
          },
          (error) => {
            this.throwError(error);
          }
        );
    }
  }

  ngOnDestroy() {
    this.exercise?.unsubscribe();
    this.componentRef?.destroy();
    this.loadingSubscription?.unsubscribe();
  }

  private inflateComponent<T extends ExerciseComponentType>(
    type: Type<T>,
    exercise: Exercise
  ) {
    this.loadingSubscription?.unsubscribe();
    if (this.exerciseUrl) {
      const factory = this.factoryResolver.resolveComponentFactory(type);
      this.container.clear();
      const component = this.container.createComponent(factory);
      this.componentRef = component;
      this.loadingSubscription = component.instance.loaded.subscribe(() => {
        this.isLoading = false;
        this.loadingSubscription?.unsubscribe();
      });
      component.instance.data = exercise;
      component.instance.subject = this.subject;
      component.instance.exerciseId = this.getExerciseId(this.exerciseUrl);
    }
  }

  private throwError(error: any) {
    this.isLoading = false;
    this.isError = true;
    console.error('Exercise error', error);
    //TODO Handle response error
    switch (error.status) {
      case 404:
      case null:
        //No exercise found
        break;
      default:
      //Unknown error
    }
  }

  private getExerciseId(exercisePath: string) {
    const matches = exercisePath.match(categoryRegex);
    if (matches && matches.length > 0) return matches[matches.length - 1];
    else return '';
  }
}
