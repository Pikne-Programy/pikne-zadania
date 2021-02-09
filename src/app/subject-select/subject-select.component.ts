import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExerciseService, Subject } from '../exercise-service/exercise.service';
import { capitalize } from '../helper/utils';

@Component({
  selector: 'app-subject-select',
  templateUrl: './subject-select.component.html',
  styleUrls: ['./subject-select.component.scss'],
})
export class SubjectSelectComponent implements AfterContentInit, OnDestroy {
  list: Subject[] = [];
  isLoading = true;
  isError = false;

  private subjectListSub?: Subscription;
  constructor(
    private exerciseService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterContentInit(): void {
    this.subjectListSub = this.exerciseService
      .getSubjectList()
      .subscribe((response: Subject[] | null) => {
        if (response === null) {
          this.isLoading = false;
          this.isError = true;
        } else if (response.length > 0) {
          this.list = response;
          this.isError = false;
          this.isLoading = false;
        }
        if (this.list.length == 1) {
          this.router.navigate(['subjects', 0, this.list[0].name], {
            relativeTo: this.route,
          });
        }
      });
  }

  ngOnDestroy() {
    this.subjectListSub?.unsubscribe();
  }

  capitalize(string: string): string | null {
    return capitalize(string);
  }
}
