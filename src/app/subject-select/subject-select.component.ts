import { AfterContentInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseService, Subject } from '../exercise-service/exercise.service';
import { capitalize } from '../helper/utils';

@Component({
  selector: 'app-subject-select',
  templateUrl: './subject-select.component.html',
  styleUrls: ['./subject-select.component.scss'],
})
export class SubjectSelectComponent implements AfterContentInit {
  list: Subject[] = [];
  isLoading = true;
  isError = false;

  constructor(
    private exerciseService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterContentInit(): void {
    this.exerciseService
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
          this.router.navigate(
            [{ outlets: { content: ['subjects', this.list[0].name] } }],
            { relativeTo: this.route }
          );
        }
      });
  }

  capitalize(string: string): string | null {
    return capitalize(string);
  }
}
