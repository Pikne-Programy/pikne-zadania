import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HierarchyModificationComponent } from './hierarchy-modification.component';

xdescribe('HierarchyModificationComponent', () => {
    let component: HierarchyModificationComponent;
    let fixture: ComponentFixture<HierarchyModificationComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HierarchyModificationComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HierarchyModificationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
