import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
}
