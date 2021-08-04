import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ExerciseService } from 'src/app/exercise-service/exercise.service';
import { Exercise } from 'src/app/exercises/exercises';
import { getErrorCode } from 'src/app/helper/utils';
import {
  Subject,
  SubjectService,
  ViewExerciseTreeNode,
} from '../subject.service/subject.service';

interface ExerciseError {
  code: number;
  id: string;
}

class ExerciseWithId extends Exercise {
  constructor(ex: Exercise, public id: string) {
    super(ex.type, ex.name, ex.content, ex.done);
  }
}

@Component({
  selector: 'app-subject-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class SubjectDashboardComponent implements OnInit, OnDestroy {
  private readonly SubjectError = 420;

  subject?: Subject;
  categoryTree?: ViewExerciseTreeNode;
  currentNode?: ViewExerciseTreeNode;
  exerciseList: ExerciseWithId[] | null = null;

  isLoading = true;
  isExerciseLoading = false;
  private _errorCode: number | null = null;
  get errorCode(): number | null {
    if (this.isLoading) return null;
    if (!this.subject) return this.SubjectError;
    return this._errorCode;
  }
  exerciseError: ExerciseError | null = null;

  exercise$?: Subscription;
  constructor(
    private subjectService: SubjectService,
    private exerciseService: ExerciseService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const subjectId = params.get('subjectId');
      if (subjectId) {
        this.subject = new Subject(subjectId);
        this.subjectService
          .fetchExerciseTree(subjectId)
          .then((tree) => {
            tree.isSelected = true;
            this.categoryTree = tree;
            this.currentNode = tree;
            this.getCurrentNodeExercises();
          })
          .catch((error) => (this._errorCode = getErrorCode(error)))
          .finally(() => (this.isLoading = false));
      }
    });
  }

  checkNodeChildren(node: ViewExerciseTreeNode): boolean {
    return (
      node.children.length > 0 &&
      node.children.some((child) => child.children.length > 0)
    );
  }

  onTreeNodeClick(node: ViewExerciseTreeNode) {
    const newState = !node.isSelected;
    this.currentNode = newState
      ? node
      : node.parent
      ? node.parent
      : this.categoryTree;

    node.parent?.children.forEach((child) => {
      child.isSelected = false;
      this.clearSelectedChildren(child);
    });
    node.isSelected = newState;
    this.getCurrentNodeExercises();
    if (!node.isSelected) this.clearSelectedChildren(node);
  }

  clearSelectedChildren(node: ViewExerciseTreeNode) {
    node.children.forEach((child) => {
      child.isSelected = false;
      this.clearSelectedChildren(child);
    });
  }

  getCurrentNodeExercises() {
    this.exerciseError = null;

    if (!this.currentNode) {
      this.exerciseList = null;
      return;
    }
    if (!this.subject) {
      this._errorCode = this.SubjectError;
      this.exerciseList = null;
      return;
    }

    const exerciseIds: string[] = [];
    this.currentNode.children.forEach((node) => {
      if (node.url) exerciseIds.push(node.url);
    });
    if (exerciseIds.length === 0) {
      this.exerciseList = null;
      return;
    }
    this.isExerciseLoading = true;

    const result: ExerciseWithId[] = [];
    const obs = new BehaviorSubject<number>(0);
    this.exercise$?.unsubscribe();
    this.exercise$ = obs.subscribe((val) => {
      if (val === exerciseIds.length) {
        this.exerciseList = result;
        setTimeout(() => {
          this.isExerciseLoading = false;
        }, 5000);

        this.exercise$?.unsubscribe();
        obs.complete();
      }
    });
    for (const url of exerciseIds) {
      this.exerciseService
        .getExercise(this.subject.id, url)
        .then((exercise) => {
          result.push(new ExerciseWithId(exercise, url));
          obs.next(result.length);
        })
        .catch((error) => {
          const code = getErrorCode(error);
          this.exerciseError = { code, id: url };
          this.isExerciseLoading = false;
          this.exercise$?.unsubscribe();
          obs.complete();
        });
    }
  }

  getTypesettingStrategy(
    exercise: Exercise,
    index: number
  ): boolean | undefined {
    switch (exercise.type) {
      case 'EqEx':
        if (!this.exerciseList) return undefined;
        return index === this.exerciseList.length - 1;
      default:
        return undefined;
    }
  }

  getErrorMessage(errorCode: number): string | undefined {
    switch (errorCode) {
      case 404:
        return 'Ups, przedmiot, którego szukasz, nie istnieje!';
      default:
        return undefined;
    }
  }

  getExerciseErrorMessage(exerciseError: ExerciseError): string {
    return `Błąd podczas ładowania zadania '${exerciseError.id}'`;
  }

  ngOnDestroy() {
    this.exercise$?.unsubscribe();
  }
}
