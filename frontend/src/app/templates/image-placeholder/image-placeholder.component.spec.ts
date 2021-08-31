/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImagePlaceholderComponent } from './image-placeholder.component';

xdescribe('ImagePlaceholderComponent', () => {
    let component: ImagePlaceholderComponent;
    let fixture: ComponentFixture<ImagePlaceholderComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ImagePlaceholderComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ImagePlaceholderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
