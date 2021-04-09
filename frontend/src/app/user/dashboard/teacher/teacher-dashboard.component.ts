import { Component, Input, OnInit } from '@angular/core';
import { Account } from 'src/app/account/account.service';
import { DashboardComponentType } from '../dashboard.component';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
})
export class TeacherDashboardComponent
  implements DashboardComponentType, OnInit {
  @Input() account!: Account;
  constructor() {}

  ngOnInit() {}
}
