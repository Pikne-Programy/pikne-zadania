/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EqexPreviewComponent } from './eqex.component';

describe('EqexComponent', () => {
  let component: EqexPreviewComponent;
  let fixture: ComponentFixture<EqexPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EqexPreviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EqexPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
