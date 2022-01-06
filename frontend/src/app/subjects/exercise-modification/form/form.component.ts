import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import {
    Exercise,
    ExerciseModificationService
} from '../service/exercise-modification.service';
import {
    exerciseTypesFull,
    isExerciseType,
    PreviewExercise
} from 'src/app/exercise-service/exercises';
import { Observable, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { getErrorCode } from 'src/app/helper/utils';
import { highlightList } from './highlight-utils/highlight.utils';
import { HighlightTextareaComponent } from 'src/app/templates/highlight-textarea/highlight-textarea.component';
import { SnippetService } from './snippet.service/snippet.service';
import { FileHeader, FileUploadService, isFileHeader } from '../../file-upload.service/file-upload.service';
import { EqExHeader, ExerciseHeader } from '../service/exercise-modification.utils';

interface AbstractControlWarn extends AbstractControl {
    warnings: ValidationErrors | null;
}

@Component({
    selector: 'app-exercise-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.scss']
})
export class ExerciseModificationFormComponent
implements OnInit, AfterViewInit {
    private readonly InternalError = 40080;
    private readonly IdError = 409;
    readonly previewErrorMessage = 'Błąd podglądu';

    isHighlightingEnabled = true;
    highlightList = highlightList;

    @Input() exercise!: Exercise;
    @Input() subjectId!: string;
    @Input() exerciseId?: string;
    /**
     * Set of exercise ids that are already present in the subject
     */
    @Input() exerciseSet?: Set<string>;
    @Output() onSuccess = new EventEmitter<string | undefined>();
    @Output() onCancel = new EventEmitter();

    @ViewChild('textareaComp')
    textareaComponent!: HighlightTextareaComponent;
    textarea$ = new Subject<ElementRef<HTMLTextAreaElement>>();

    form!: FormGroup;
    get type() {
        return this.form.get('type') as AbstractControlWarn | null;
    }
    get name() {
        return this.form.get('name');
    }
    get content() {
        return this.form.get('content');
    }

    filteredTypes?: Observable<string[]>;
    private typeList: string[] = Array.from(exerciseTypesFull);

    preview?: PreviewExercise;
    isPreview = false;
    isPreviewLoading = false;
    previewErrorCode: number | null = null;

    isSubmitted = false;
    errorCode: number | null = null;

    isUnknownTypeModalOpen = false;
    isConfirmCancelModalOpen = false;

    isTextareaFocused = false;
    isToolbarFocused = false;

    private isCreation = true;
    hasNewFiles = false;
    constructor(
        private exerciseService: ExerciseModificationService,
        public snippetService: SnippetService,
        public fileService: FileUploadService
    ) {}

    ngOnInit() {
        this.isCreation = this.exerciseId === undefined;
        this.form = new FormGroup({
            type: new FormControl(this.exercise.header.type, [
                Validators.required,
                this.formatValidator(),
                this.typeValidator()
            ]),
            name: new FormControl(this.exercise.header.name, [
                Validators.required,
                this.formatValidator(),
                this.nameValidator()
            ]),
            content: new FormControl(this.exercise.content, [
                Validators.required
            ])
        });
        this.filteredTypes = this.type!.valueChanges.pipe(
            startWith(this.exercise.header.type),
            map((value) => this._filter(value))
        );
        this.fileService.isNew = true;
        this.fileService.resetAddedFiles();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.textarea$.next(this.textareaComponent.textarea);
        }, 20);
    }

    updateExercise(): Exercise {
        this.exercise.header.type = this.type!.value;
        this.exercise.header.name = this.name!.value;
        this.exercise.content = this.content!.value;

        //#region ExT-dependent updates
        if (EqExHeader.isEqExHeader(this.exercise.header))
            this.exercise.header.img = this.fileService.addedFiles;
        //#endregion

        return this.exercise;
    }

    getPreview(fromTab: boolean = true) {
        this.snippetService.closeSnippet();
        if (!this.preview) {
            if (fromTab) this.isPreviewLoading = true;
            this.previewErrorCode = null;
            this.exerciseService
                .getExercisePreview(this.updateExercise(), this.subjectId)
                .then((preview) => (this.preview = preview))
                .catch((error) => {
                    this.previewErrorCode = getErrorCode(
                        error,
                        this.InternalError
                    );
                })
                .finally(() => {
                    this.isPreview = true;
                    this.isPreviewLoading = false;
                });
        }
        else this.isPreview = true;
    }

    submit(nextRoute?: string) {
        this.snippetService.closeSnippet();
        if (this.type!.warnings?.type) this.isUnknownTypeModalOpen = true;
        else {
            if (!this.isModified())
                this.onSuccess.emit(nextRoute);
            else {
                this.isSubmitted = true;
                const content = this.updateExercise();
                const promise = this.isCreation
                    ? this.exerciseService.addExercise(this.subjectId, content)
                    : this.exerciseService.updateExercise(
                          this.subjectId,
                          this.exerciseId!,
                          content
                      );
                promise
                    .then(() => this.onSuccess.emit(nextRoute))
                    .catch((error) => {
                        const code = getErrorCode(error);
                        if (code === this.IdError) {
                            if (!this.exerciseSet) this.exerciseSet = new Set();
                            this.exerciseSet.add(this.name!.value);
                            this.name!.updateValueAndValidity();
                        }
                        else this.errorCode = code;
                    })
                    .finally(() => (this.isSubmitted = false));
            }
        }
    }

    cancel() {
        if (this.type!.dirty || this.name!.dirty || this.content!.dirty)
            this.isConfirmCancelModalOpen = true;
        else this.onCancel.emit();
    }

    toggleHighlighting() {
        this.isHighlightingEnabled = !this.isHighlightingEnabled;
        this.highlightList = this.isHighlightingEnabled ? highlightList : [];
    }

    hasFiles(header: ExerciseHeader): header is FileHeader {
        return isFileHeader(header);
    }

    //#region Validators & filters
    isModified(): boolean {
        return this.type!.dirty ||
        this.name!.dirty ||
        this.content!.dirty ||
        this.hasNewFiles;
    }

    private typeValidator() {
        return (control: AbstractControlWarn): ValidationErrors | null => {
            control.warnings =
                typeof control.value === 'string' &&
                control.value.trim().length > 0 &&
                !isExerciseType(control.value)
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
