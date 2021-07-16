import { Component, OnInit } from '@angular/core';
import { getErrorCode } from 'src/app/helper/utils';
import { SpecialPanelItem } from 'src/app/templates/panel/panel.component';
import { Subject, SubjectService } from '../subject.service/subject.service';

@Component({
  selector: 'app-subject-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class SubjectListComponent implements OnInit {
  subjectList: Subject[] = [];

  errorCode: number | null = null;
  isLoading = true;
  currentList = 0;
  constructor(private subjectService: SubjectService) {}

  ngOnInit() {
    this.subjectService
      .fetchSubjects()
      .then((list) => (this.subjectList = list))
      .catch((error) => (this.errorCode = getErrorCode(error)))
      .finally(() => (this.isLoading = false));
  }

  createList(): SpecialPanelItem[] {
    return this.subjectList.map((subject) => [
      subject.getName(),
      subject.id,
      subject.isPrivate ? 'fa-lock' : 'fa-book',
      false,
      subject.isPrivate,
    ]);
  }

  addNewSubject() {}
}
