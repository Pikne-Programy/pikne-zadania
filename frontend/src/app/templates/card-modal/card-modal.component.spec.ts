/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CardModalComponent } from './card-modal.component';

describe('CardModalComponent', () => {
    let component: CardModalComponent;
    let fixture: ComponentFixture<CardModalComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [CardModalComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CardModalComponent);
        component = fixture.componentInstance;
        component.open = false;
        component.title = 'Modal title';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();

        expect(trimClass(component.class)).toBe('modal has-navbar');
    });

    describe('CSS class', () => {
        it('should return closed modal with navbar', () => {
            expect(component).toBeTruthy();
            component.open = false;
            component.hasNavbarMargin = true;
            fixture.detectChanges();

            expect(trimClass(component.class)).toBe('modal has-navbar');
        });

        it('should return closed modal without navbar', () => {
            expect(component).toBeTruthy();
            component.open = false;
            component.hasNavbarMargin = false;
            fixture.detectChanges();

            expect(trimClass(component.class)).toBe('modal');
        });

        it('should return opened modal with navbar', () => {
            expect(component).toBeTruthy();
            component.open = true;
            component.hasNavbarMargin = true;
            fixture.detectChanges();

            expect(trimClass(component.class)).toBe('modal is-active has-navbar');
        });

        it('should return opened modal without navbar', () => {
            expect(component).toBeTruthy();
            component.open = true;
            component.hasNavbarMargin = false;
            fixture.detectChanges();

            expect(trimClass(component.class)).toBe('modal is-active');
        });
    });

    it('should emit on close', () => {
        const spy = spyOn(component.onClose, 'emit');

        component.closeModal();
        expect(spy).toHaveBeenCalledWith();
    });
});

function trimClass(text: string): string {
    return text.trim().replace(/\s\s+/g, ' ');
}
