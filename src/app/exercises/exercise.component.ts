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
  exercise?: Subscription;
  @ViewChild('exContainer', { read: ViewContainerRef })
  container!: ViewContainerRef;
  componentRef?: ComponentRef<ExerciseComponentType>;

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
                  this.throwError(response);
              }
            }
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
  }

  private inflateComponent<T extends ExerciseComponentType>(
    type: Type<T>,
    exercise: Exercise
  ) {
    if (this.exerciseUrl) {
      const factory = this.factoryResolver.resolveComponentFactory(type);
      this.container.clear();
      const component = this.container.createComponent(factory);
      this.componentRef = component;
      component.instance.loaded.subscribe(() => {
        this.isLoading = false;
        component.instance.loaded.unsubscribe();
      });
      component.instance.data = exercise;
      component.instance.subject = this.subject;
      component.instance.exerciseId = this.getExerciseId(this.exerciseUrl);
    }
  }

  private throwError(error: any) {
    console.error('Exercise error', error);
    //TODO Handle response error
  }

  private getExerciseId(exercisePath: string) {
    const matches = exercisePath.match(categoryRegex);
    if (matches && matches.length > 0) return matches[matches.length - 1];
    else return '';
  }
}
