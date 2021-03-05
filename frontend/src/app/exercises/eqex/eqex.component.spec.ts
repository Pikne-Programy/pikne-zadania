/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EqexComponent } from './eqex.component';

describe('EqexComponent', () => {
  let component: EqexComponent;
  let fixture: ComponentFixture<EqexComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EqexComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EqexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
