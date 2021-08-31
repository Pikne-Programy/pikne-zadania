import { AfterContentInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getErrorCode } from '../helper/utils';
import {
    Subject,
    SubjectService
} from '../subjects/subject.service/subject.service';
import { SpecialPanelItem } from '../templates/panel/panel.component';

@Component({
    selector: 'app-subject-select',
    templateUrl: './subject-select.component.html',
    styleUrls: ['./subject-select.component.scss']
})
export class SubjectSelectComponent implements AfterContentInit {
  list: Subject[] = [];
  isLoading = true;
  errorCode: number | null = null;

  constructor(
    private subjectService: SubjectService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterContentInit() {
      this.subjectService
          .getSubjects()
          .then((response) => {
              this.list = response;
              this.isLoading = false;
              if (this.list.length === 1) {
                  this.router.navigate(['subjects', this.list[0].id], {
                      relativeTo: this.route,
                      queryParams: { isSingleSubject: this.list.length === 1 }, // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                      skipLocationChange: true
                  });
              }
          })
          .catch((error) => (this.errorCode = getErrorCode(error)));
  }

  getSubjectList(): SpecialPanelItem[] {
      return this.list.map((val) => [
          val.getName(),
          val.id,
          'fa-book',
          false,
          val.isPrivate
      ]);
  }
}
