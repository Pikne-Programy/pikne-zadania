/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TeamItemComponent } from './item.component';

describe('TeamItemComponent', () => {
  let component: TeamItemComponent;
  let fixture: ComponentFixture<TeamItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TeamItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
