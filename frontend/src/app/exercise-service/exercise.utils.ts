import { capitalize, isObject } from '../helper/utils';
import { ExerciseType, exerciseTypes } from './exercises';

export interface ServerResponseNode {
    type?: ExerciseType;
    name: string;
    children: ServerResponseNode[] | string;
    done?: number | null;
    description?: string;
}

export class Subject {
    static createSubject(
        serverResponse: ServerResponseNode,
        shouldGetLocalDone: boolean
    ): ExerciseTreeNode | null {
        if (!Array.isArray(serverResponse.children)) return null;
        return ExerciseTreeNode.createExerciseTree(
            shouldGetLocalDone,
            serverResponse.name,
            serverResponse.children,
            serverResponse.name
        );
    }

    static checkSubjectValidity(
        object: any,
        shouldHaveType: boolean = false,
        root: boolean = true
    ): object is ServerResponseNode {
        return (
            isObject<ServerResponseNode>(object, [
                ['type', ['string', 'undefined']],
                ['name', ['string']],
                ['children', 'any'],
                ['done', ['number', 'null', 'undefined']],
                ['description', ['string', 'undefined']]
            ]) &&
            (Array.isArray(object.children)
                ? object.children.every((child) =>
                    Subject.checkSubjectValidity(child, shouldHaveType, false)
                  )
                : !root && typeof object.children === 'string') &&
            (shouldHaveType && typeof object.children === 'string'
                ? object.type !== undefined &&
                  exerciseTypes.includes(object.type)
                : true)
        );
    }
}

export class ExerciseTreeNode {
    children: ExerciseTreeNode[] = [];
    constructor(
        public value: string,
        public parent: ExerciseTreeNode | null,
        public type?: ExerciseType,
        public description?: string,
        public url: string | null = null,
        public done?: number | null
    ) {}

    static createExerciseTree(
        getLocal: boolean,
        value: string,
        children: ServerResponseNode[],
        subject: string,
        parent: ExerciseTreeNode | null = null
    ): ExerciseTreeNode {
        const node = new ExerciseTreeNode(value, parent);
        children.forEach((child) => {
            if (Array.isArray(child.children)) {
                node.children.push(
                    this.createExerciseTree(
                        getLocal,
                        child.name,
                        child.children,
                        subject,
                        node
                    )
                );
            }
            else {
                if (child.done !== undefined && getLocal)
                    setLocalDone(subject, child.children, child.done);
                node.children.push(
                    new ExerciseTreeNode(
                        capitalize(child.name)!,
                        node,
                        child.type,
                        child.description,
                        child.children,
                        child.done === undefined && getLocal
                            ? getLocalDone(subject, child.children)
                            : child.done
                    )
                );
            }
        });
        return node;
    }
}

function getLocalDone(subject: string, id: string): number | null {
    const localDone = localStorage.getItem(`${subject}/${id}`);
    switch (localDone) {
        case null:
        case 'null':
            return null;
        default:
            if (isNaN(Number(localDone))) return null;
            return Number(localDone);
    }
}

function setLocalDone(subject: string, id: string, done: number | null) {
    localStorage.setItem(`${subject}/${id}`, done?.toString() ?? 'null');
}
