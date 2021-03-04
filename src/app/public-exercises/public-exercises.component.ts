import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ExerciseService,
  ExerciseTreeNode,
  Subject,
} from 'src/app/exercise-service/exercise.service';
import { categoryRegex, categorySeparator } from 'src/app/exercises/exercises';
import {
  ScreenSizeService,
  ScreenSizes,
} from 'src/app/helper/screen-size.service';
import { capitalize } from 'src/app/helper/utils';

@Component({
  selector: 'app-public-exercises',
  templateUrl: './public-exercises.component.html',
  styleUrls: ['./public-exercises.component.scss'],
})
export class PublicExercisesComponent implements OnInit, OnDestroy {
  isSingleSubject = false;

  list?: ExerciseTreeNode[];
  breadcrumbs: ExerciseTreeNode[] = [];
  exercise: string | null = null;
  subject?: Subject;
  categories = new BehaviorSubject<string>('');
  currentCategory: string | null = null;

  readonly mobileSize = ScreenSizes.MOBILE;
  screenSize: number = ScreenSizes.FULL_HD;
  private screenSizeSub?: Subscription;
  private subjectList?: Subscription;
  private categoriesSub?: Subscription;
  private queryParams?: Subscription;
  constructor(
    private exerciseService: ExerciseService,
    private screenSizeService: ScreenSizeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const subjectId = this.route.snapshot.paramMap.get('subjectId');
    if (subjectId) {
      this.subjectList = this.exerciseService
        .getSubjectList()
        .subscribe((response) => {
          if (response && response.length > 0) {
            const subject = this.exerciseService.findSubjectById(
              subjectId,
              response
            );
            if (subject) {
              this.subject = subject;
              this.exercise = this.route.snapshot.queryParamMap.get('exercise');
              const current = this.currentCategory
                ? this.currentCategory
                : this.exercise
                ? this.getExercisePath()
                : '';
              this.categories.next(current);
              this.currentCategory = null;

              if (response.length == 1) this.isSingleSubject = true;
              else this.isSingleSubject = false;
            } else this.throwError();
          }
        });
    } else this.throwError();

    this.categoriesSub = this.categories.subscribe((categories) => {
      this.navigateToCategory(categories);
    });

    this.queryParams = this.route.queryParamMap.subscribe((params) => {
      this.exercise = params.get('exercise');
    });

    this.screenSizeSub = this.screenSizeService.currentSize.subscribe(
      (value) => {
        this.screenSize = value;
      }
    );
  }

  ngOnDestroy() {
    this.subjectList?.unsubscribe();
    this.categories.complete();
    this.categoriesSub?.unsubscribe();
    this.queryParams?.unsubscribe();
    this.screenSizeSub?.unsubscribe();
  }

  private throwError() {
    console.error('Wrong subject, category or exercise');
    //TODO Handle errors
  }

  navigateToCategory(newCategory: string) {
    if (this.subject) {
      let current = this.subject.exerciseTree;
      this.breadcrumbs = [current];
      const categories = newCategory.match(categoryRegex) ?? [];
      for (let i = 0; i < categories.length; i++) {
        const index = this.getCategoryIndex(current.children, categories[i]);
        if (index !== null) {
          current = current.children[index];
          this.breadcrumbs.push(current);
        } else {
          this.categories.next('');
          current = this.subject.exerciseTree;
          this.breadcrumbs = [current];
          break;
        }
      }
      this.list = current.children;
    }
  }

  navigate(node: ExerciseTreeNode) {
    if (node.url !== null)
      this.router.navigate(['./'], {
        relativeTo: this.route,
        queryParams: { exercise: node.getPath() },
        queryParamsHandling: 'merge',
        skipLocationChange: node.url === null,
      });
    else {
      const parent = this.categories.getValue();
      this.categories.next(
        `${parent !== '' ? parent + categorySeparator : ''}${node.value}`
      );
    }
  }

  navigateToBreadcrumb(node: ExerciseTreeNode) {
    this.categories.next(node.getPath());
  }

  getCategoryIndex(list: ExerciseTreeNode[], name: string): number | null {
    const index = list.findIndex((node) => node.value === name);
    if (index == -1) return null;
    else return index;
  }

  getExerciseUrl(): string | undefined {
    return this.exercise ?? undefined;
  }

  getExercisePath(exercise: string | null = this.exercise): string {
    if (exercise === null) return '';
    const matches = exercise.match(categoryRegex);
    if (matches !== null && matches.length > 1) {
      let result = '';
      for (let i = 0; i < matches.length - 2; i++) {
        result += `${matches[i]}${categorySeparator}`;
      }
      result += matches[matches.length - 2];
      return result;
    } else return '';
  }

  isExerciseSelected(node: ExerciseTreeNode): boolean {
    return node.url !== null && node.getPath() === this.exercise;
  }

  resetExercise() {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: { exercise: null },
      queryParamsHandling: 'merge',
    });
  }

  capitalize(string: string | null): string | null {
    return capitalize(string);
  }

  updateExerciseTree() {
    if (this.breadcrumbs.length > 0)
      this.currentCategory = this.breadcrumbs[
        this.breadcrumbs.length - 1
      ].getPath();
    this.exerciseService.updateSubjectList();
  }
}
