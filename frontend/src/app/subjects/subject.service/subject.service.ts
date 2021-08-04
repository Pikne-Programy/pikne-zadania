import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ExerciseTreeNode,
  ServerResponseNode,
  Subject as TreeSubject,
} from 'src/app/exercise-service/exercise.utils';
import * as ServerRoutes from 'src/app/server-routes';

export class Subject {
  readonly isPrivate: boolean;

  constructor(public id: string) {
    this.isPrivate = id.charAt(0) == '_';
  }

  getName() {
    return this.isPrivate ? this.id.substr(1) : this.id;
  }
}

export class ViewExerciseTreeNode extends ExerciseTreeNode {
  isSelected = false;
  children: ViewExerciseTreeNode[];
  parent: ViewExerciseTreeNode | null;

  constructor(
    node: ExerciseTreeNode,
    parent: ViewExerciseTreeNode | null = null
  ) {
    super(node.value, node.parent, node.url, node.done);
    this.children = node.children.map(
      (child) => new ViewExerciseTreeNode(child, this)
    );
    this.parent = parent;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private readonly TypeError = 400;

  constructor(private http: HttpClient) {}

  private createSubjectList(serverResponse: string[]): Subject[] {
    const res = serverResponse.map((id) => new Subject(id));
    res.sort((a, b) => {
      const comp = a
        .getName()
        .toLocaleLowerCase()
        .localeCompare(b.getName().toLocaleLowerCase());
      if (!comp) {
        if (a.isPrivate && !b.isPrivate) return 1;
        if (!a.isPrivate && b.isPrivate) return -1;
        return 0;
      }
      return comp;
    });
    return res;
  }

  fetchSubjects(): Promise<Subject[]> {
    return this.http
      .get(ServerRoutes.subjectList)
      .pipe(
        switchMap((response) =>
          Array.isArray(response) &&
          response.every((val) => typeof val === 'string')
            ? of(this.createSubjectList(response))
            : throwError({ status: this.TypeError })
        )
      )
      .toPromise();
  }

  private createExerciseTree(
    serverResponse: ServerResponseNode[]
  ): ViewExerciseTreeNode | null {
    const result = TreeSubject.createSubjectList(serverResponse, false);
    if (!result || result.length !== 1) return null;
    return new ViewExerciseTreeNode(result[0].exerciseTree);
  }

  fetchExerciseTree(subjectId: string): Promise<ViewExerciseTreeNode> {
    return this.http
      .post(ServerRoutes.subjectExerciseList, { id: subjectId })
      .pipe(
        switchMap((response) => {
          const subject = [
            {
              name: subjectId,
              children: response,
            },
          ];
          if (TreeSubject.checkSubjectListValidity(subject)) {
            const tree = this.createExerciseTree(subject);
            return tree ? of(tree) : throwError({ status: this.TypeError });
          } else return throwError({ status: this.TypeError });
        })
      )
      .toPromise();
  }
}
