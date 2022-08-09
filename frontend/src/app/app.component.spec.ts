import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { report, staticFile } from './server-routes';
import * as config from './helper/tests/tests.config';
import * as server from './helper/tests/server';

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [AppComponent]
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'Niedostateczny'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app.title).toEqual('Niedostateczny');
    });

    it('should start mock server', () => {
        spyOnProperty(config, 'serverMockEnabled').and.returnValue(true as any);
        const serverSpy = jasmine
            .createSpy('startServer')
            .and.callFake(() => console.log('server started')); // eslint-disable-line no-console
        spyOnProperty(server, 'startServer', 'get').and.returnValue(serverSpy);

        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();

        expect(serverSpy).toHaveBeenCalledWith();
    });
});

describe('Server API', () => {
    const fileName = 'abc';

    it('should return report URL', () => {
        expect(report(fileName)).toBe(`/api/session/static/${fileName}`);
    });

    it('should return static file URL', () => {
        const subject = 's1';
        expect(staticFile(subject, fileName)).toBe(
            `/api/subject/static/${subject}/${fileName}`
        );
    });
});
