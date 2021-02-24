import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { categorySeparator } from '../exercises/exercises';
import { capitalize } from '../helper/utils';
import * as ServerRoutes from './server-routes';

export class Subject {
  constructor(public name: string, public exerciseTree: ExerciseTreeNode) {}
}

export class ExerciseTreeNode {
  children: ExerciseTreeNode[] = [];
  constructor(
    public value: string | null,
    public parent: ExerciseTreeNode | null,
    public url: string | null = null,
    public done?: number | null
  ) {}

  getPath(): string {
    if (this.parent && this.parent.parent)
      return `${this.parent.getPath()}${categorySeparator}${
        this.url ? this.url : this.value
      }`;
    else return this.url ? this.url : this.value!;
  }
}

interface ServerResponseNode {
  name: string;
  children: any;
  done?: number | null;
}
/**
 * @returns Whether provided object is an instance of ServerResponseNode
 */
function instanceOfSRN(object: any): object is ServerResponseNode {
  return 'name' in object;
}

@Injectable({
  providedIn: 'root',
})
export class ExerciseService implements OnDestroy {
  private subjectList = new BehaviorSubject<Subject[] | null>([]);
  private subjectSubscription?: Subscription;

  constructor(private http: HttpClient) {
    this.updateSubjectList();
  }

  ngOnDestroy() {
    this.subjectSubscription?.unsubscribe();
    this.subjectList.complete();
  }

  private createSubjectList(serverResponse: ServerResponseNode[]): Subject[] {
    const list: Subject[] = [];
    serverResponse.forEach((node) => {
      list.push(
        new Subject(
          node.name,
          this.createExerciseTree(node.name, node.children, node.name)
        )
      );
    });
    return list;
  }

  private createExerciseTree(
    value: string | null,
    children: ServerResponseNode[],
    subject: string,
    parent: ExerciseTreeNode | null = null
  ): ExerciseTreeNode {
    const node = new ExerciseTreeNode(value, parent);
    children.forEach((child) => {
      if (Array.isArray(child.children)) {
        node.children.push(
          this.createExerciseTree(child.name, child.children, subject, node)
        );
      } else {
        node.children.push(
          new ExerciseTreeNode(
            capitalize(child.name),
            node,
            child.children,
            child.done === undefined ? null : child.done
          )
        );
      }
    });
    return node;
  }

  getSubjectList(): BehaviorSubject<Subject[] | null> {
    return this.subjectList;
  }

  findSubjectById(id: string, subjectList: Subject[]): Subject | null {
    return subjectList.find((subject) => subject.name === id) ?? null;
  }

  getExerciseList(subjectPos: number): ExerciseTreeNode | null {
    const list = this.subjectList.getValue();
    if (list !== null && subjectPos < list.length && subjectPos >= 0)
      return list[subjectPos].exerciseTree;
    else return null;
  }

  private fetchExercises() {
    return this.http.get(ServerRoutes.publicExerciseListPath);
  }

  getExercise(subject: string, id: string) {
    return this.http.get(
      `${ServerRoutes.publicExerciseListPath}/${subject}/${id}`
    );
  }

  postAnswers(subject: string, id: string, answers: any) {
    return this.http.post(
      `${ServerRoutes.publicExerciseListPath}/${subject}/${id}`,
      answers
    );
  }

  updateSubjectList() {
    this.subjectSubscription?.unsubscribe();
    this.subjectSubscription = this.fetchExercises().subscribe(
      (response) => {
        if (
          Array.isArray(response) &&
          response.length > 0 &&
          instanceOfSRN(response[0])
        )
          this.subjectList.next(this.createSubjectList(response));
        else this.subjectList.next(null);
      },
      () => {
        this.subjectList.next(null);
      }
    );
  }
}
