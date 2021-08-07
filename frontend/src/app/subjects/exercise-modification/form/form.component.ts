import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  Exercise,
  ExerciseModificationService,
} from '../service/exercise-modification.service';
import {
  Exercise as PreviewExercise,
  exerciseTypes,
} from 'src/app/exercises/exercises';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { getErrorCode } from 'src/app/helper/utils';

interface AbstractControlWarn extends AbstractControl {
  warnings: ValidationErrors | null;
}

@Component({
  selector: 'app-exercise-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class ExerciseModificationFormComponent implements OnInit {
  private readonly IdError = 409;

  @Input() exercise!: Exercise;
  @Input() subjectId!: string;
  @Input() exerciseId?: string;
  /**
   * Set of exercise ids that are already present in the subject
   */
  @Input() exerciseSet?: Set<string>;
  @Output() onSuccess = new EventEmitter();
  @Output() onCancel = new EventEmitter();

  form!: FormGroup;
  get type() {
    return this.form.get('type') as AbstractControlWarn;
  }
  get name() {
    return this.form.get('name');
  }
  get content() {
    return this.form.get('content');
  }

  filteredTypes?: Observable<string[]>;
  private typeList: string[] = Array.from(exerciseTypes);
  private typeSet: Set<string> = new Set(
    exerciseTypes.map((type) => type.toUpperCase())
  );

  preview?: PreviewExercise;
  isPreview = false;
  isPreviewLoading = false;

  isSubmitted = false;
  errorCode: number | null = null;

  isUnknownTypeModalOpen = false;
  isConfirmCancelModalOpen = false;

  private isCreation = true;
  constructor(private exerciseService: ExerciseModificationService) {}

  ngOnInit() {
    this.isCreation = this.exerciseId === undefined;
    this.form = new FormGroup({
      type: new FormControl(this.exercise.type, [
        Validators.required,
        this.formatValidator(),
        this.typeValidator(),
      ]),
      name: new FormControl(this.exercise.name, [
        Validators.required,
        this.formatValidator(),
        this.nameValidator(),
      ]),
      content: new FormControl(this.exercise.content, [Validators.required]),
    });
    this.filteredTypes = this.type!.valueChanges.pipe(
      startWith(this.exercise.type),
      map((value) => this._filter(value))
    );
  }

  createExercise(): Exercise {
    return new Exercise(
      this.type!.value,
      this.name!.value,
      this.content!.value
    );
  }

  getPreview() {
    this.isPreview = true;
    //TODO Preview
  }

  submit() {
    if (this.type!.pristine && this.name!.pristine && this.content!.pristine)
      this.onSuccess.emit();
    else {
      this.isSubmitted = true;
      const content = this.createExercise();
      const promise = this.isCreation
        ? this.exerciseService.addExercise(this.subjectId, content)
        : this.exerciseService.updateExercise(
            this.subjectId,
            this.exerciseId!,
            content
          );
      promise
        .then(() => this.onSuccess.emit())
        .catch((error) => {
          const code = getErrorCode(error);
          if (code === this.IdError) {
            if (!this.exerciseSet) this.exerciseSet = new Set();
            this.exerciseSet.add(this.name!.value);
            this.name!.updateValueAndValidity();
          } else this.errorCode = code;
        })
        .finally(() => (this.isSubmitted = false));
    }
  }

  cancel() {
    if (this.type!.dirty || this.name!.dirty || this.content!.dirty)
      this.isConfirmCancelModalOpen = true;
    else this.onCancel.emit();
  }

  //#region Validators & filters
  private typeValidator() {
    return (control: AbstractControlWarn): ValidationErrors | null => {
      control.warnings =
        typeof control.value === 'string' &&
        control.value.trim().length > 0 &&
        !this.typeSet.has(control.value.toLocaleUpperCase())
          ? { type: { value: control.value } }
          : null;
      return null;
    };
  }

  private nameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      this.isCreation &&
      this.exerciseSet &&
      typeof control.value === 'string' &&
      this.exerciseSet.has(Exercise.generateId(control.value))
        ? { name: { value: control.value } }
        : null;
  }

  private formatValidator(): ValidatorFn {
    const regex = /---/g;
    return (control: AbstractControl): ValidationErrors | null =>
      typeof control.value === 'string' && regex.test(control.value)
        ? { format: { value: control.value } }
        : null;
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLocaleUpperCase();
    return this.typeList.filter((type) =>
      type.toUpperCase().includes(filterValue)
    );
  }
  //#endregion
}
