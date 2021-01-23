import * as Utils from '../helper/utils.js';
import { EquationExercise } from '../eqex/model.js';

/**
 * @type {TreeNode}
 */
export var exerciseTree = null;
export const currentMenu = new Utils.Observable()
export const currentExercise = new Utils.Observable();

/**
 * Function starting the Model. Sets provided callbacks and fetches Exercise list.
 * @param {function} menuChangeCallback Function executed on current Menu change
 * @param {function} exerciseChangeCallback Function executed on current Exercise change
 * @async
 */
export async function startModel(menuChangeCallback, exerciseChangeCallback) {
    currentMenu.callback = menuChangeCallback;
    currentExercise.callback = exerciseChangeCallback;
    fetchExerciseList().then((result) => {
        exerciseTree = createExerciseTree(null, result);
        currentMenu.set(exerciseTree);
    });
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
function createExerciseTree(value, children, parent = null) {
    const node = new TreeNode(value, parent);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typeof Array.isArray === 'undefined') {
            Array.isArray = function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            }
        }
        if (Array.isArray(child.children)) {
            node.children.push(createExerciseTree(Utils.capitalize(child.name), child.children, node));
        } else {
            node.children.push(new TreeNode(Utils.capitalize(child.name), node, child.children));
        }
    }
    return node;
}

export class TreeNode {
    /**
     * Node element of the Exercise tree structure
     * @param {any} value Value held by the node
     * @param {TreeNode?} parent Parent node (root node's is null)
     * @param {string?} url URL held by the node (only for deepest nodes)
     */
    constructor(value, parent, url = null) {
        this.value = value;
        this.children = [];
        this.parent = parent;
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