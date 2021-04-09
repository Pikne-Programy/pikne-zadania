import { Component, Input, OnInit } from '@angular/core';
import { Account } from 'src/app/account/account.service';
import { DashboardComponentType } from '../dashboard.component';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
})
export class UserDashboardComponent implements DashboardComponentType, OnInit {
  @Input() account!: Account;
  constructor() {}

  ngOnInit() {}
}
