import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';
import { saveAs } from 'file-saver';

type ReportList = {
    filenames: string[];
};

function isReportList(object: any): object is ReportList {
    return (
        isObject<ReportList>(object, [['filenames', 'array']]) &&
        object.filenames.every((filename) => typeof filename === 'string')
    );
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    constructor(private http: HttpClient) {}

    getReport(filename: string) {
        return (
            this.http
                .get(ServerRoutes.report(filename), {
                    responseType: 'arraybuffer'
                })
                // .pipe(map((file) => file))
                .toPromise()
                .then((buff) => {
                    const blob = new Blob([buff]);
                    saveAs(blob, filename);
                })
        );
    }

    getReportList(teamId: number): Promise<string[]> {
        return this.http
            .post(ServerRoutes.reportList, { teamId })
            .pipe(
                switchMap((response) =>
                    isReportList(response)
                        ? of(response.filenames)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    saveReport(teamId: number): Promise<string> {
        return this.http
            .post(ServerRoutes.reportSave, { teamId })
            .pipe(
                switchMap((response) =>
                    isObject<{ filename: string }>(response, [
                        ['filename', ['string']]
                    ])
                        ? of(response.filename)
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    deleteReport(filename: string) {
        return this.http
            .post(ServerRoutes.reportDelete, { filename })
            .toPromise();
    }
}
