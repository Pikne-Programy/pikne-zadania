import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';
import { removeMathTabIndex } from 'src/app/helper/utils';
import { ExerciseComponent } from '../exercises';
declare var MathJax: any;

class Unknown {
  private formatRegex = /^[+-]?\d*[,\.]?\d*$/;
  isWrongFormat = false;
  isCorrect = false;
  isWrong = false;

  input: string = '';
  constructor(public name: string, public unit: string) {}

  checkFormat() {
    this.isCorrect = false;
    this.isWrong = false;
    this.isWrongFormat = !this.formatRegex.test(this.input);
  }

  setAnswerCorrectness(value: boolean) {
    if (value) this.isCorrect = true;
    else this.isWrong = true;
  }
}

@Component({
  selector: 'app-eqex',
  templateUrl: './eqex.component.html',
  styleUrls: ['./eqex.component.scss'],
})
export class EqexComponent
  implements ExerciseComponent, AfterViewInit, OnDestroy {
  @Output() loaded = new EventEmitter<string>();
  isLoading = true;

  @Input() subject?: string;
  @Input() exerciseId?: string;
  private _data: any;
  @Input() set data(value: any) {
    this._data = value;
    this.title = this._data.name;
    this.subtitle = this._data.content.main;
    this.images = this._data.content.imgs;
    if (this._data.content.unknowns) {
      const tempList: Unknown[] = [];
      this._data.content.unknowns.forEach((unknown: string[]) => {
        tempList.push(new Unknown(unknown[0], unknown[1]));
      });
      this.unknowns = tempList;
    }
    if (!this.images || this.images.length == 0) this.onLoaded();
  }
  title?: string;
  subtitle?: string;
  images?: string[];
  unknowns?: Unknown[];

  private answerSubscription?: Subscription;
  private loadedImages: boolean[] = [];
  isSubmitted = false;
  constructor(private exerciseService: ExerciseService) {}

  getTextAsMath(text: string): string {
    return `\\(${text}\\)`;
  }

  submitAnswers() {
    if (this.unknowns && this.subject && this.exerciseId) {
      this.isSubmitted = true;
      const list: number[] = [];
      this.unknowns.forEach((unknown) => {
        const text = unknown.input;
        list.push(Number(text.replace(',', '.')));
      });
      this.answerSubscription?.unsubscribe();
      this.answerSubscription = this.exerciseService
        .postAnswers(this.subject, this.exerciseId, list)
        .subscribe(
          (response) => {
            this.isSubmitted = false;
            console.log('response', response);

            if (Array.isArray(response) && this.unknowns) {
              for (
                let i = 0;
                i < response.length && i < this.unknowns.length;
                i++
              )
                this.unknowns[i].setAnswerCorrectness(response[i]);
            }
          },
          (error) => {
            this.isSubmitted = false;
            console.error('Answer error', error);
            //TODO Handle Response error
          }
        );
    }
  }

  ngOnDestroy() {
    this.answerSubscription?.unsubscribe();
  }

  onImageLoaded() {
    this.loadedImages.push(true);
    if (this.loadedImages.length == this.images?.length && this.isLoading)
      this.onLoaded();
  }

  private onLoaded() {
    this.loaded.emit('loaded');
    this.isLoading = false;
  }

  checkIfSubmitDisabled(): boolean {
    return this.unknowns?.some((unknown) => unknown.isWrongFormat) ?? false;
  }

  ngAfterViewInit() {
    MathJax.typeset();
    removeMathTabIndex();
  }
}
