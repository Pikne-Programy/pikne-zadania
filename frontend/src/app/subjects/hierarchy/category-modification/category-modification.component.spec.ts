import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryModificationComponent } from './category-modification.component';

xdescribe('ExerciseModificationComponent', () => {
    let component: CategoryModificationComponent;
    let fixture: ComponentFixture<CategoryModificationComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CategoryModificationComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CategoryModificationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
