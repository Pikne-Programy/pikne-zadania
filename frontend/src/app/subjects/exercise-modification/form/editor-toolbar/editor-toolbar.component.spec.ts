/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditorToolbarComponent } from './editor-toolbar.component';

xdescribe('EditorToolbarComponent', () => {
    let component: EditorToolbarComponent;
    let fixture: ComponentFixture<EditorToolbarComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [EditorToolbarComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(EditorToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
