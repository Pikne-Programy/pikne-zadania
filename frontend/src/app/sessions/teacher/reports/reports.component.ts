import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { ReportService } from '../../services/report.service';
import { SessionService } from '../../services/session.service';

@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
    teamId?: number;
    teamName?: string;
    reportList: string[] = [];

    isLoading = true;
    errorCode: number | null = null;
    downloadIndex: number | null = null;
    deleteIndex: number | null = null;

    //#region Delete Report Modal
    isModalOpen = false;
    modalData?: [string, number];

    openModal(filename: string, index: number) {
        this.modalData = [filename, index];
        this.isModalOpen = true;
    }

    closeModal() {
        if (this.deleteIndex === null) {
            this.modalData = undefined;
            this.isModalOpen = false;
        }
    }
    //#endregion

    param$?: Subscription;
    constructor(
        private reportService: ReportService,
        private sessionService: SessionService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const teamId = Number(params.get('teamId'));
            if (!isNaN(teamId)) {
                this.teamId = teamId;
                this.sessionService
                    .getTeamName(teamId)
                    .then((teamName) => (this.teamName = teamName))
                    .catch((error) => console.warn('Team name error', error))
                    .then(() => this.refreshList());
            }
        });
    }

    refreshList() {
        if (this.teamId !== undefined) {
            this.isLoading = true;

            this.reportService
                .getReportList(this.teamId)
                .then((reports) => (this.reportList = reports))
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => (this.isLoading = false));
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    getHeader() {
        return this.teamName ? `Raporty\xa0-\xa0${this.teamName}` : 'Raporty';
    }

    downloadReport(filename: string, index: number) {
        this.downloadIndex = index;
        this.reportService
            .getReport(filename)
            .catch((error) => (this.errorCode = getErrorCode(error)))
            .finally(() => (this.downloadIndex = null));
    }

    deleteReport() {
        if (this.modalData) {
            const [filename, index] = this.modalData;
            this.deleteIndex = index;
            this.reportService
                .deleteReport(filename)
                .then(() => this.refreshList())
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => {
                    this.deleteIndex = null;
                    this.closeModal();
                });
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
