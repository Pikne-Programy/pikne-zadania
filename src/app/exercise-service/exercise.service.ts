import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
          new ExerciseTreeNode(capitalize(child.name), node, child.children)
        );
      }
    });
    return node;
  }

  getSubjectList(): BehaviorSubject<Subject[] | null> {
    return this.subjectList;
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
}
