import * as Utils from '../helper/utils.js';
import { EquationExercise } from '../eqex/model.js';

/**
 * @type {TreeNode?}
 */
export var exerciseTree = null;
export const subjectList = new Utils.Observable();
export const currentMenu = new Utils.Observable()
export const currentExercise = new Utils.Observable();

/**
 * Function starting the Model. Sets provided callbacks and fetches Exercise list.
 * @param {function} subjectListFetchedCallback Function executed when subject list has been loaded
 * @param {function} menuChangeCallback Function executed on current Menu change
 * @param {function} exerciseChangeCallback Function executed on current Exercise change
 * @async
 */
export async function startModel(subjectListFetchedCallback, menuChangeCallback, exerciseChangeCallback) {
    subjectList.callback = subjectListFetchedCallback;
    currentMenu.callback = menuChangeCallback;
    currentExercise.callback = exerciseChangeCallback;
    fetchExerciseList().then((result) => {
        const list = [];
        result.forEach(subject => {
            list.push(new Subject(subject.name, createExerciseTree(null, subject.children, subject.name)))
        });
        subjectList.set(list);
    });
}

/**
 * Selects an element from Subject list at the provided index
 * @param {number?} i Index of the subject
 */
export function selectSubject(i) {
    const tree = i !== null ? subjectList.get()[i].exerciseTree : null;
    exerciseTree = tree;
    currentMenu.set(tree);
}

/**
 * Fetches Exercise list from server
 * @async
 */
async function fetchExerciseList() {
    let result;
    await $.getJSON('/api/public', (data) => {
        result = data;
    })
    return result;
}

/**
 * Fetches specific Exercise from server
 * @param {string} url URL of the Exercise
 * @async
 */
async function fetchExercise(url) {
    let result;
    await $.getJSON('/api/public/' + url, (data) => {
        result = data;
    });
    return result;
}

/**
 * Creates a TreeNode and assigns value, parent & children to it
 * @param {any} value Value assigned to node
 * @param {TreeNode[]} children Children nodes assigned to node
 * @param {TreeNode} parent Parent node assigned to node
 */
function createExerciseTree(value, children, subject, parent = null) {
    const node = new TreeNode(value, parent);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typeof Array.isArray === 'undefined') {
            Array.isArray = function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            }
        }
        if (Array.isArray(child.children)) {
            node.children.push(createExerciseTree(Utils.capitalize(child.name), child.children, subject, node));
        } else {
            node.children.push(new TreeNode(Utils.capitalize(child.name), node, subject + '/' + child.children));
        }
    }
    return node;
}

export class Subject {
    /**
     * Element of the subject list fetched from server
     * @param {string} name Name of the subject
     * @param {TreeNode} exerciseTree Tree structure of subject's exercises
     */
    constructor(name, exerciseTree) {
        /**
         * @type {string}
         */
        this.name = name;
        /**
         * @type {TreeNode}
         */
        this.exerciseTree = exerciseTree;
    }
}

export class TreeNode {
    /**
     * Node element of the Exercise tree structure
     * @param {any} value Value held by the node
     * @param {TreeNode?} parent Parent node (root node's is null)
     * @param {string?} url URL held by the node (only for deepest nodes)
     */
    constructor(value, parent, url = null) {
        /**
         * @type {any}
         */
        this.value = value;
        /**
         * @type {TreeNode[]}
         */
        this.children = [];
        /**
         * @type {TreeNode?}
         */
        this.parent = parent;
        /**
         * @type {string?}
         */
        this.url = url;
    }

    /**
     * Sets this node as currentMenu or fetches exercise if it's the deepest node
     * @returns {boolean} True - node set as currentMenu; False - fetched Exercise
     */
    select() {
        if (this.url == null) {
            currentMenu.set(this);
            return true;
        } else {
            fetchExercise(this.url).then((result) => {
                //TODO Check for exercise type
                currentExercise.set(new EquationExercise(this.url, result));
            });
            return false;
        }
    }
}

/**
 * Resets currently selected Exercise
 * @async
 */
export async function clearCurrentExercise() {
    currentExercise.set(null);
    $('#content-container').empty();
}