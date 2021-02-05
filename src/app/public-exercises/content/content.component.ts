import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ExerciseService,
  ExerciseTreeNode,
  Subject,
} from 'src/app/exercise-service/exercise.service';
import { capitalize, Tuple } from 'src/app/helper/utils';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, OnDestroy {
  list?: ExerciseTreeNode[];
  breadcrumbs: ExerciseTreeNode[] = [];
  exercise: string | null = null;
  subject?: Subject;
  indices: string = '';
  private subjectList?: Subscription;
  private params?: Subscription;
  private queryParams?: Subscription;

  constructor(
    private exerciseService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const subjectIndex = this.route.snapshot.paramMap.get('subjectIndex');
    const indices = this.route.snapshot.queryParamMap.get('categories');
    if (subjectIndex) {
      const index = Number(subjectIndex);
      this.subjectList = this.exerciseService
        .getSubjectList()
        .subscribe((response) => {
          if (response && response.length > 0) {
            this.subject = response[index];
            this.navigateByIndices(indices);
          }
        });
    }
    this.queryParams = this.route.queryParamMap.subscribe((params) => {
      const category = params.get('categories');
      const exerciseId = params.get('exercise');
      this.exercise = exerciseId;
      if (category !== null) this.navigateByIndices(category);
    });
  }

  ngOnDestroy() {
    this.subjectList?.unsubscribe();
    this.params?.unsubscribe();
    this.queryParams?.unsubscribe();
  }

  navigateByIndices(newIndices: string | null) {
    this.getIndices();
    if (this.subject) {
      if (newIndices !== null) this.indices = newIndices;
      let current = this.subject.exerciseTree;
      this.breadcrumbs = [current];
      const indices = this.getIndices();
      for (let i = 0; i < indices.length; i++) {
        const index = Number(indices[i]);
        current = current.children[index];
        this.breadcrumbs.push(current);
      }
      this.list = current.children;
    }
  }

  navigate(node: ExerciseTreeNode, i: number) {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: this.getQueryParams(node, i),
      queryParamsHandling: 'merge',
    });
  }

  getQueryParams(node: ExerciseTreeNode, i: number) {
    if (node.url !== null) return { exercise: i + '\\' + node.url };
    else return { categories: this.makeIndices(i, node) };
  }

  navigateToBreadcrumb(i: number) {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: {
        categories: i == 0 ? '' : this.makeBreadcrumbIndices(i),
      },
      queryParamsHandling: 'merge',
    });
  }

  getIndices(): string {
    const indexRegex = /\d+/g;
    if (indexRegex.test(this.indices)) {
      let result = '';
      this.indices.match(indexRegex)!.forEach((index) => {
        result += index;
      });
      return result;
    } else return '';
  }

  makeIndices(i: number, node: ExerciseTreeNode): string {
    const start = this.indices === '' ? '' : this.indices + '\\\\';
    return start + i.toString() + '\\' + node.value;
  }

  makeBreadcrumbIndices(breadcrumbIndex: number): string {
    const indexRegex = /(?:\d\\[^(?:\\\\)]+(?:\\\\)?)/g;
    if (!indexRegex.test(this.indices)) return '';
    let result = '';
    const matches = this.indices.match(indexRegex)!;
    for (let i = 0; i <= breadcrumbIndex - 1 && i < matches.length; i++)
      result += matches[i];
    if (result[result.length - 1] === '\\\\')
      result = result.substr(0, result.length - 1);
    return result;
  }

  isExerciseSelected(node: ExerciseTreeNode, i: number): boolean {
    const urlRegex = /\d+\\([^\\]+)/;
    const indexRegex = /\d+/;
    if (!this.exercise || !this.exercise.match(urlRegex)) return false;
    return (
      node.url === this.exercise.match(urlRegex)![1] &&
      i == Number(this.exercise.match(indexRegex))
    );
  }

  getExerciseUrl(): string | undefined {
    if (!this.exercise) return undefined;
    else {
      const regex = /\d+\\([^\\]+)/;
      const match = this.exercise.match(regex);

      return match === null ? undefined : match[1];
    }
  }

  capitalize(string: string | null): string | null {
    return capitalize(string);
  }
}
