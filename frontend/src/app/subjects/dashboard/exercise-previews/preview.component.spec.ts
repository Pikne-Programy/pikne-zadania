/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SubjectDashboardPreviewComponent } from './preview.component';

describe('PreviewComponent', () => {
  let component: SubjectDashboardPreviewComponent;
  let fixture: ComponentFixture<SubjectDashboardPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubjectDashboardPreviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectDashboardPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
