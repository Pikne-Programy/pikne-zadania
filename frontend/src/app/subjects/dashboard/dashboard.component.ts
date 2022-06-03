import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { getErrorCode, TYPE_ERROR } from 'src/app/helper/utils';
import { HierarchyService } from '../hierarchy/service/hierarchy.service';
import {
    Subject,
    SubjectService,
    ViewExerciseTreeNode
} from '../subject.service/subject.service';
import { ViewExercise } from './exercise-previews/preview.component';

interface ExerciseError {
    code: number;
    id: string;
}

@Component({
    selector: 'app-subject-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class SubjectDashboardComponent implements OnInit, OnDestroy {
    private readonly SubjectError = 40020;

    subject?: Subject;
    categoryTree?: ViewExerciseTreeNode;
    currentNode?: ViewExerciseTreeNode;
    exerciseList: ViewExercise[] | null = null;

    isLoading = true;
    isExerciseLoading = false;
    private _errorCode: number | null = null;
    get errorCode(): number | null {
        if (this.isLoading) return null;
        if (!this.subject) return this.SubjectError;
        return this._errorCode;
    }
    exerciseError: ExerciseError | null = null;

    param$?: Subscription;
    constructor(
        private subjectService: SubjectService,
        private hierarchyService: HierarchyService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            if (subjectId) {
                this.subject = new Subject(subjectId);
                this.subjectService
                    .getExerciseTree(subjectId, true)
                    .then((tree) => {
                        tree.isSelected = true;
                        this.categoryTree = tree;
                        this.currentNode = tree;
                        this.getCurrentNodeExercises();
                    })
                    .catch((error) => (this._errorCode = getErrorCode(error)))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });
    }

    checkNodeChildren(node: ViewExerciseTreeNode): boolean {
        return node.children.some((child) => child.url === null);
    }

    checkNodeIfIsCategory(node: ViewExerciseTreeNode): boolean {
        return node.url === null && node.value !== '';
    }

    onTreeNodeClick(node: ViewExerciseTreeNode) {
        const newState = !node.isSelected;
        this.currentNode = newState
            ? node
            : node.parent
                ? node.parent
                : this.categoryTree;

        node.parent?.children.forEach((child) => {
            child.isSelected = false;
            this.clearSelectedChildren(child);
        });
        node.isSelected = newState;
        this.getCurrentNodeExercises();
        if (!node.isSelected) this.clearSelectedChildren(node);
    }

    clearSelectedChildren(node: ViewExerciseTreeNode) {
        node.children.forEach((child) => {
            child.isSelected = false;
            this.clearSelectedChildren(child);
        });
    }

    getCurrentNodeExercises() {
        this.exerciseError = null;

        if (!this.currentNode) {
            this.exerciseList = null;
            return;
        }
        if (!this.subject) {
            this._errorCode = this.SubjectError;
            this.exerciseList = null;
            return;
        }

        const exercises: ViewExerciseTreeNode[] =
            this.currentNode.children.filter((node) => node.url);

        if (exercises.length === 0) {
            this.exerciseList = null;
            return;
        }
        for (const node of exercises) {
            if (!node.type) {
                this.exerciseError = { code: TYPE_ERROR, id: node.url! };
                return;
            }
        }

        this.isExerciseLoading = true;
        this.exerciseList = exercises.map((node) => ({
            id: node.url!,
            type: node.type!,
            name: node.value,
            desc: node.description
        }));
    }

    isLast(index: number): boolean {
        return !this.exerciseList || index === this.exerciseList.length - 1;
    }

    navigateToExerciseCreation(parent: ViewExerciseTreeNode) {
        if (this.subject) {
            this.hierarchyService.setNewExerciseHierarchy(parent);
            this.router.navigate(['/subject/exercise-new', this.subject.id]);
        }
    }

    navigateToExerciseCreationFromRoot() {
        if (this.subject) {
            this.hierarchyService.setNewExerciseHierarchyAsRoot();
            this.router.navigate(['/subject/exercise-new', this.subject.id]);
        }
    }

    navigateToCategoryModification(parent: ViewExerciseTreeNode) {
        if (this.subject) {
            this.hierarchyService.setNewExerciseHierarchy(parent);
            this.router.navigate(['/subject/category-edit', this.subject.id]);
        }
    }

    navigateToCategoryModificationFromRoot() {
        if (this.subject) {
            this.hierarchyService.setNewExerciseHierarchyAsRoot();
            this.router.navigate(['/subject/category-edit', this.subject.id]);
        }
    }

    getErrorMessage(errorCode: number): string | undefined {
        switch (errorCode) {
            case 404:
                return 'Ups, przedmiot, którego szukasz, nie istnieje!';
            default:
                return undefined;
        }
    }

    getExerciseErrorMessage(exerciseError: ExerciseError): string {
        return `Błąd podczas ładowania zadania '${exerciseError.id}'`;
    }

    ngOnDestroy() {
        this.param$?.unsubscribe();
    }
}
