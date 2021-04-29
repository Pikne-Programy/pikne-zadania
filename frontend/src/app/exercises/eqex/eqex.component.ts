import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AccountService } from 'src/app/account/account.service';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';
import { Role, RoleGuardService } from 'src/app/guards/role-guard.service';
import { serverMockEnabled } from 'src/app/helper/tests/tests.config';
import { getErrorCode, removeMathTabIndex } from 'src/app/helper/utils';
import { image } from 'src/app/server-routes';
import { Exercise, ExerciseComponent, ExerciseType } from '../exercises';
declare var MathJax: any;

class Unknown {
  private formatRegex = /^[+-]?\d*(?:[,\.]\d+)?(?:[eE][+-]?\d+)?$/;
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
    this.isCorrect = false;
    this.isWrong = false;
    this.isWrongFormat = false;
    if (value) this.isCorrect = true;
    else this.isWrong = true;
  }
}

@Component({
  selector: 'app-eqex',
  templateUrl: './eqex.component.html',
  styleUrls: ['./eqex.component.scss'],
})
export class EqexComponent implements ExerciseComponent, AfterViewInit {
  private loadedImages: boolean[] = [];
  @Output() loaded = new EventEmitter<string>();
  isSubmitted = false;
  isLoading = true;
  @Output() onAnswers = new EventEmitter<number | null>();

  @Input() subject?: string;
  @Input() exerciseId?: string;
  @Input() set data(value: Exercise) {
    this.title = value.name;
    this.subtitle = value.content.main;
    this.imgAlts = value.content.img;
    this.images = serverMockEnabled
      ? value.content.img
      : this.getImages(value.content.img);
    if (value.content.unknowns) {
      const tempList: Unknown[] = [];
      value.content.unknowns.forEach((unknown: string[]) => {
        tempList.push(new Unknown(unknown[0], unknown[1]));
      });
      this.unknowns = tempList;
    }
    if (!this.images || this.images.length == 0) this.onLoaded();
  }
  title?: string;
  subtitle?: string;
  images?: string[];
  private imgAlts?: string[];
  unknowns: Unknown[] = [];

  private isUser: boolean;
  constructor(
    private exerciseService: ExerciseService,
    accountService: AccountService
  ) {
    const account = accountService.currentAccount.getValue();
    this.isUser = account
      ? RoleGuardService.getRole(account) === Role.USER
      : true;
  }

  getTextAsMath(text: string): string {
    return `\\(${text}\\)`;
  }

  submitAnswers() {
    if (this.subject && this.exerciseId) {
      this.isSubmitted = true;
      const list: (number | null)[] = [];
      this.unknowns.forEach((unknown) => {
        const text = unknown.input;
        list.push(text !== '' ? Number(text.replace(',', '.')) : null);
      });
      this.exerciseService
        .submitAnswers(this.subject, this.exerciseId, list)
        .then((response) => {
          if (Exercise.isEqExAnswer(response, this.unknowns.length)) {
            if (this.exerciseId && this.isUser)
              this.setLocalDone(this.exerciseId, response);
            this.onAnswers.emit(null);
            for (let i = 0; i < response.length; i++)
              this.unknowns[i].setAnswerCorrectness(response[i]);
          } else this.throwError();
        })
        .catch((error) => this.throwError(error))
        .finally(() => (this.isSubmitted = false));
    }
  }

  setLocalDone(name: string, answers: any) {
    Exercise.setDone(ExerciseType.EqEx, name, answers);
  }

  private throwError(error: any = {}) {
    this.onAnswers.emit(getErrorCode(error));
  }

  ngAfterViewInit() {
    MathJax.typeset();
    removeMathTabIndex();
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

  private getImages(paths: any): string[] | undefined {
    if (this.subject && paths && Array.isArray(paths)) {
      const res: string[] = [];
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        if (typeof path !== 'string') return undefined;
        res.push(image(this.subject, path));
      }
      return res;
    } else return undefined;
  }

  getImageAlt(i: number): string {
    let alt = 'Błąd wczytywania obrazka';
    const images = this.imgAlts;
    if (images && Array.isArray(images) && i < images.length)
      alt += ` ${images[i]}`;
    return alt;
  }
}
