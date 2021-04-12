import { AfterContentInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseService } from '../exercise-service/exercise.service';
import { Subject } from '../exercise-service/exercise.utils';

@Component({
  selector: 'app-subject-select',
  templateUrl: './subject-select.component.html',
  styleUrls: ['./subject-select.component.scss'],
})
export class SubjectSelectComponent implements AfterContentInit {
  list: Subject[] = [];
  isLoading = true;
  errorCode: number | null = null;

  constructor(
    private exerciseService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterContentInit() {
    this.exerciseService.getSubjectList().then((response) => {
      if (Array.isArray(response)) {
        this.list = response;
        this.isLoading = false;
        if (this.list.length == 1) {
          this.router.navigate(['subjects', this.list[0].name], {
            relativeTo: this.route,
          });
        }
      } else this.errorCode = response;
    });
  }
}
