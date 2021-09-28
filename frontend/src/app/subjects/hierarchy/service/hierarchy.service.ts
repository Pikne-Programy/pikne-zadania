import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';
import { isExerciseListType } from '../../exercise-modification/service/exercise-modification.utils';

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

@Injectable({
    providedIn: 'root'
})
export class HierarchyService {
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
}
