import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
    public url: string | null = null
  ) {}

  /**
   * Sets this node as currentMenu or fetches exercise if it's the deepest node
   * @returns True - node set as currentMenu; False - fetched Exercise
   */
  select(): boolean {
    /*if (this.url == null) {
      currentMenu.set(this);
      return true;
    } else {
      fetchExercise(this.url).then((result) => {
        //TODO Check for exercise type
        currentExercise.set(new EquationExercise(this.url, result));
      });
      return false;
    }*/
    return false;
  }
}

interface ServerResponseNode {
  name: string;
  children: any;
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
export class ExerciseService {
  private subjectList = new BehaviorSubject<Subject[] | null>([]);
  private subjectObservable = this.fetchExercises();

  constructor(private http: HttpClient) {
    this.subjectObservable.subscribe(
      (response) => {
        if (
          Array.isArray(response) &&
          response.length > 0 &&
          instanceOfSRN(response[0])
        )
          this.subjectList.next(this.createSubjectList(response));
        else this.subjectList.next(null);
      },
      (error) => {
        this.subjectList.next(null);
      }
    );
  }

  private createSubjectList(serverResponse: ServerResponseNode[]): Subject[] {
    const list: Subject[] = [];
    serverResponse.forEach((node) => {
      list.push(
        new Subject(
          node.name,
          this.createExerciseTree(null, node.children, node.name)
        )
      );
    });
    return list;
  }

  private createExerciseTree(
    value: string | null,
    children: ExerciseTreeNode[],
    subject: string,
    parent: ExerciseTreeNode | null = null
  ): ExerciseTreeNode {
    const node = new ExerciseTreeNode(value, parent);
    children.forEach((child) => {
      if (Array.isArray(child.children)) {
        node.children.push(
          this.createExerciseTree(
            capitalize(child.value),
            child.children,
            subject,
            node
          )
        );
      } else {
        node.children.push(
          new ExerciseTreeNode(
            capitalize(child.value),
            node,
            subject + '/' + child.children
          )
        );
      }
    });
    return node;
  }

  getSubjectList(): BehaviorSubject<Subject[] | null> {
    return this.subjectList;
  }

  private fetchExercises() {
    return this.http.get(ServerRoutes.publicExerciseListPath);
  }
}
