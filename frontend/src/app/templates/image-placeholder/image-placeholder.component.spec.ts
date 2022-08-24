/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImagePlaceholderComponent } from './image-placeholder.component';

describe('ImagePlaceholderComponent', () => {
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
        const path = 'assets/misc/mock_pic';
        const alt = 'mock_alt';
        component.src = `${path}.png`;
        component.srcset = `${path}.svg`;
        component.alt = alt;
        expect(component).toBeTruthy();

        expect(component.src).toBe(`${path}.png`);
        expect(component.srcset).toBe(`${path}.svg`);
        expect(component.alt).toBe(alt);
    });

    it('should create default', () => {
        expect(component).toBeTruthy();

        expect(component.src).toBe('assets/misc/png/exercise_placeholder.png');
        expect(component.srcset).toBe('assets/misc/exercise_placeholder.svg');
        expect(component.alt).toBe('');
    });
});
