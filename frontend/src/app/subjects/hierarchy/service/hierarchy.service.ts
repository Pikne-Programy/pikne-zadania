import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';
import {
    isExerciseListType,
    ListedExerciseType
} from '../../exercise-modification/service/exercise-modification.utils';
import { ViewExerciseTreeNode } from '../../subject.service/subject.service';

interface ServerHierarchyNode {
    name: string;
    children: ServerHierarchyNode[] | string;
}
function isHierarchyNode(object: any): object is ServerHierarchyNode {
    const hasFields = isObject<ServerHierarchyNode>(object, [
        ['name', ['string']],
        ['children', 'any']
    ]);
    if (!hasFields) return false;
    if (typeof object.children === 'string') return true;
    return Array.isArray(object.children)
        ? object.children.every((child: any) => isHierarchyNode(child))
        : false;
}
function mapToServerHierarchyTree(
    hierarchyTree: HierarchyNode[]
): ServerHierarchyNode[] {
    return hierarchyTree
        .filter((node) => node.name !== '')
        .map((node) => {
            if (node.exerciseId) {
                return {
                    name: node.name,
                    children: node.exerciseId
                };
            }
            return {
                name: node.name,
                children: mapToServerHierarchyTree(node.children)
            };
        });
}

export interface HierarchyNode {
    id: string;
    name: string;
    children: HierarchyNode[];
    parent: HierarchyNode | null;
    exerciseId?: string;
    isSelected: boolean;
}
function mapToHierarchyTree(
    serverResponse: ServerHierarchyNode[],
    parent: HierarchyNode | null = null
): HierarchyNode[] {
    return serverResponse.map((node, i) => {
        if (Array.isArray(node.children)) {
            const result: HierarchyNode = {
                id: (parent ? `${parent.id}_` : '') + i.toString(),
                name: node.name,
                children: [],
                parent,
                isSelected: false
            };
            result.children = mapToHierarchyTree(node.children, result);
            return result;
        }
        return {
            id: (parent ? `${parent.id}_` : '') + i.toString(),
            name: node.name,
            children: [],
            parent,
            exerciseId: node.children,
            isSelected: false
        };
    });
}

export interface CategoryExercise extends ListedExerciseType {
    isSelected: boolean;
    isDisabled: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class HierarchyService {
    private currentCategory: string[] | null = null;
    /* eslint-disable @typescript-eslint/naming-convention */
    private static CURRENT_CATEGORY_ERROR_CODE = 48800;
    private static SUBCATEGORY_ERROR_CODE = 48801;
    private static ADD_TO_ROOT_CODE = 48802;
    /* eslint-enable @typescript-eslint/naming-convention */

    constructor(private http: HttpClient) {}

    private isServerHierarchyTree(
        object: any
    ): object is ServerHierarchyNode[] {
        return (
            Array.isArray(object) &&
            object.every((node) => isHierarchyNode(node))
        );
    }

    private hasEmptyNodes(
        tree: ServerHierarchyNode[],
        count: number = 1
    ): boolean {
        return (
            tree.filter((node) => node.name === '').length > count &&
            tree.some((node) => {
                if (Array.isArray(node.children))
                    return this.hasEmptyNodes(node.children, 0);
                else return false;
            })
        );
    }

    getHierarchy(subject: string): Promise<HierarchyNode[]> {
        return this.http
            .post(ServerRoutes.hierarchyGet, { subject, raw: true })
            .pipe(
                switchMap((response) =>
                    this.isServerHierarchyTree(response) &&
                    !this.hasEmptyNodes(response)
                        ? of(mapToHierarchyTree(response))
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    setHierarchy(subject: string, tree: HierarchyNode[]) {
        return this.http
            .post(ServerRoutes.hierarchySet, {
                subject,
                hierarchy: mapToServerHierarchyTree(
                    this.removeNotAssigned(tree)
                )
            })
            .toPromise();
    }

    setExerciseHierarchy(subject: string, hierarchy: ServerHierarchyNode[]) {
        return this.http
            .post(ServerRoutes.hierarchySet, {
                subject,
                hierarchy
            })
            .toPromise();
    }

    getExercises(subjectId: string): Promise<HierarchyNode[]> {
        return this.http
            .post(ServerRoutes.subjectExerciseList, { subject: subjectId })
            .pipe(
                switchMap((response) =>
                    isExerciseListType(response)
                        ? of(
                              response.exercises
                                  .map((exercise, i) => ({
                                      id: `un-${i}`,
                                      name: exercise.name,
                                      children: [],
                                      parent: null,
                                      exerciseId: exercise.id,
                                      isSelected: false
                                  }))
                                  .sort((a, b) => a.name.localeCompare(b.name))
                          )
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    private removeNotAssigned(tree: HierarchyNode[]): HierarchyNode[] {
        return tree.filter((node) => node.name !== '');
    }

    //#region Adding/removing nodes
    static addCategoryToHierarchy(
        name: string,
        newParent: HierarchyNode | HierarchyNode[]
    ): HierarchyNode {
        const [list, parent] = Array.isArray(newParent)
            ? [newParent, null]
            : [newParent.children, newParent];
        const newCategory = {
            id: '',
            name,
            children: [],
            parent,
            isSelected: true
        };
        list.unshift(newCategory);
        this.updateHierarchyIds(newParent);
        if (parent) parent.isSelected = true;
        return newCategory;
    }

    static addExerciseToHierarchy(
        exercise: HierarchyNode,
        position: number,
        newParent: HierarchyNode | HierarchyNode[]
    ) {
        const [list, parent] = Array.isArray(newParent)
            ? [newParent, null]
            : [newParent.children, newParent];
        const shifted = list.splice(position);
        exercise.parent = parent;
        list.push(exercise);
        list.push(...shifted);
        this.updateHierarchyIds(newParent);
    }

    static removeNodeFromHierarchy(
        node: HierarchyNode,
        hierarchy: HierarchyNode[]
    ): boolean {
        const list = node.parent?.children ?? hierarchy;
        const i = list.findIndex((sibling) => sibling.id === node.id);
        if (i === -1) return false;
        const removed = list.splice(i);
        removed.shift();
        list.push(...removed);
        return true;
    }

    private static updateHierarchyIds(parent: HierarchyNode | HierarchyNode[]) {
        const [parentId, list] = !Array.isArray(parent)
            ? [`${parent.id}_`, parent.children]
            : ['', parent];
        for (let i = 0; i < list.length; i++) {
            const node = list[i];
            node.id = parentId + i.toString();
            this.updateHierarchyIds(node);
        }
    }
    //#endregion

    setNewExerciseHierarchy(parent: ViewExerciseTreeNode) {
        const result: string[] = [];
        let currentNode = parent;
        while (currentNode.parent !== null) {
            result.push(currentNode.value);
            currentNode = currentNode.parent;
        }
        this.currentCategory = result.reverse();
    }

    setNewExerciseHierarchyAsRoot() {
        this.currentCategory = [];
    }

    addNewExerciseToHierarchy(subjectId: string, exerciseId: string) {
        return this.getHierarchy(subjectId)
            .then((tree) =>
                mapToServerHierarchyTree(this.removeNotAssigned(tree))
            )
            .then((hierarchy) =>
                this.addExerciseToHierarchy(hierarchy, exerciseId)
            )
            .then((hierarchy) =>
                this.setExerciseHierarchy(subjectId, hierarchy)
            )
            .finally(() => this.resetNewExerciseHierarchy());
    }

    private addExerciseToHierarchy(
        hierarchy: ServerHierarchyNode[],
        exerciseId: string
    ): ServerHierarchyNode[] {
        const list = this.currentCategory;
        if (!list)
            throw { status: HierarchyService.CURRENT_CATEGORY_ERROR_CODE };

        if (list.length === 0) {
            hierarchy.push({
                name: exerciseId,
                children: exerciseId
            });
            return hierarchy;
        }

        /* let currentNode = hierarchy.find((node) => node.name === list[0]);
        let i = 0;
        while (i < list.length) {
            i++;
            if (!currentNode || typeof currentNode.children === 'string')
                throw { status: HierarchyService.SUBCATEGORY_ERROR_CODE };

            if (i < list.length) {
                currentNode = currentNode.children.find(
                    (node) => node.name === list[i]
                );
            }
        }
        (currentNode!.children as ServerHierarchyNode[]).push({
            name: exerciseId,
            children: exerciseId,
        }); */
        this.findCategory(hierarchy, list).push({
            name: exerciseId,
            children: exerciseId
        });
        return hierarchy;
    }

    getNewExercisesForCategory(subjectId: string): Promise<CategoryExercise[]> {
        const list = this.currentCategory;
        if (!list)
            throw { status: HierarchyService.CURRENT_CATEGORY_ERROR_CODE };

        return this.getPresentCategoryExercises(subjectId, list).then(
            (presentExercises) =>
                this.getExercisesForCategory(subjectId, presentExercises)
        );
    }

    private getPresentCategoryExercises(
        subjectId: string,
        category: string[]
    ): Promise<Set<string>> {
        return this.getHierarchy(subjectId)
            .then((tree) =>
                mapToServerHierarchyTree(this.removeNotAssigned(tree))
            )
            .then((hierarchy) => {
                if (category.length === 0)
                    throw { status: HierarchyService.ADD_TO_ROOT_CODE };

                /* let currentNode = hierarchy.find(
                    (node) => node.name === category[0]
                );
                let i = 0;
                while (i < category.length) {
                    i++;
                    if (
                        !currentNode ||
                        typeof currentNode.children === 'string'
                    ) {
                        throw {
                            status: HierarchyService.SUBCATEGORY_ERROR_CODE,
                        };
                    }

                    if (i < category.length) {
                        currentNode = currentNode.children.find(
                            (node) => node.name === category[i]
                        );
                    }
                }
                const exercises = (
                    currentNode!.children as ServerHierarchyNode[]
                ) */
                const exercises = this.findCategory(hierarchy, category)
                    .filter((node) => typeof node.children === 'string')
                    .map((node) => node.children as string);
                return new Set(exercises);
            });
    }

    private getExercisesForCategory(
        subjectId: string,
        presentExercises: Set<string>
    ): Promise<CategoryExercise[]> {
        return this.http
            .post(ServerRoutes.subjectExerciseList, { subject: subjectId })
            .pipe(
                switchMap((response) =>
                    isExerciseListType(response)
                        ? of(
                              response.exercises
                                  .map((exercise) => ({
                                      id: exercise.id,
                                      type: exercise.type,
                                      name: exercise.name,
                                      description: exercise.description,
                                      isSelected: presentExercises.has(
                                          exercise.id
                                      ),
                                      isDisabled: presentExercises.has(
                                          exercise.id
                                      )
                                  }))
                                  .sort((a, b) => a.name.localeCompare(b.name))
                          )
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    shouldGetFromSubject(): boolean {
        return (
            this.currentCategory !== null && this.currentCategory.length === 0
        );
    }

    getNewExercisesForSubject(subjectId: string): Promise<CategoryExercise[]> {
        return this.getPresentExercisesForRoot(subjectId).then(
            (presentExercises) =>
                this.getExercisesForCategory(subjectId, presentExercises)
        );
    }

    private getPresentExercisesForRoot(
        subjectId: string
    ): Promise<Set<string>> {
        return this.getHierarchy(subjectId)
            .then((tree) =>
                mapToServerHierarchyTree(this.removeNotAssigned(tree))
            )
            .then((hierarchy) => {
                const exercises = hierarchy
                    .filter((node) => typeof node.children === 'string')
                    .map((node) => node.children as string);
                return new Set(exercises);
            });
    }

    addNewExercisesToCategory(
        subjectId: string,
        exercises: CategoryExercise[]
    ) {
        const list = this.currentCategory;
        if (!list)
            throw { status: HierarchyService.CURRENT_CATEGORY_ERROR_CODE };

        const selected: ServerHierarchyNode[] = exercises
            .filter((exercise) => exercise.isSelected && !exercise.isDisabled)
            .map((exercise) => ({
                name: exercise.name,
                children: exercise.id
            }));

        return this.getHierarchy(subjectId)
            .then((tree) =>
                mapToServerHierarchyTree(this.removeNotAssigned(tree))
            )
            .then((hierarchy) => {
                if (list.length === 0) hierarchy.push(...selected);
                else this.findCategory(hierarchy, list).push(...selected);
                /* let currentNode = hierarchy.find(
                        (node) => node.name === list[0]
                    );
                    let i = 0;
                    while (i < list.length) {
                        i++;
                        if (
                            !currentNode ||
                            typeof currentNode.children === 'string'
                        ) {
                            throw {
                                status: HierarchyService.SUBCATEGORY_ERROR_CODE,
                            };
                        }

                        if (i < list.length) {
                            currentNode = currentNode.children.find(
                                (node) => node.name === list[i]
                            );
                        }
                    }
                    (currentNode!.children as ServerHierarchyNode[]).push(
                        ...selected
                    ); */

                return hierarchy;
            })
            .then((hierarchy) =>
                this.setExerciseHierarchy(subjectId, hierarchy)
            )
            .finally(() => this.resetNewExerciseHierarchy());
    }

    /**
     * @param categoryRoute Must have at least 1 item
     */
    private findCategory(
        hierarchy: ServerHierarchyNode[],
        categoryRoute: string[]
    ): ServerHierarchyNode[] {
        let currentNode = hierarchy.find(
            (node) => node.name === categoryRoute[0]
        );
        let i = 0;
        while (i < categoryRoute.length) {
            i++;
            if (!currentNode || typeof currentNode.children === 'string')
                throw { status: HierarchyService.SUBCATEGORY_ERROR_CODE };

            if (i < categoryRoute.length) {
                currentNode = currentNode.children.find(
                    (node) => node.name === categoryRoute[i]
                );
            }
        }
        if (!currentNode || typeof currentNode.children === 'string')
            throw { status: HierarchyService.SUBCATEGORY_ERROR_CODE };
        else return currentNode.children;
    }

    getCategoryRoute(): string[] | null {
        return this.currentCategory;
    }

    resetNewExerciseHierarchy() {
        this.currentCategory = null;
    }
}
