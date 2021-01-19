import * as Utils from '../helper/utils.js';

/**
 * Regex for unknowns' input views
 * @type {RegExp}
 */
export const inputRegex = /^[+-]?\d*[,\.]?\d*$/;

/**
 * @type {EquationExercise}
 */
export let exercise = null;

/**
 * Starts EqEx Model with provided exercise
 * @param {EquationExercise} eqex Exercise
 */
export function startModel(eqex) {
    exercise = eqex;
}

/**
 * Submits exercise to the server for verification
 * @param {function} resultCallback Callback on result from server
 * @async
 */
export async function sendAnswers(resultCallback) {
    if (exercise != null) {
        $.ajax({
            type: 'POST',
            url: exercise.id,
            data: exercise.convertUnknowns()
        }).then((result) => {
            resultCallback(result);
        });
    }
}

export class Unknown {
    /**
     * @param {string?} name 
     * @param {string} unit 
     */
    constructor(name, unit) {
        /**
         * @type {string}
         */
        this.name = name;
        /**
         * @type {string}
         */
        this.unit = unit;
        /**
         * @type {number}
         */
        this.value = null;
    }
}

export class EquationExercise {
    /**
     * @type {Utils.ExerciseType}
     */
    type = Utils.ExerciseType.EqEx;

    /**
     * Converts server's EqEx format to Model format
     * @param {string} id Id of the exercise
     * @param {any} serverResponse EqEx in server's format
     * @property {string[]} imgs
     */
    constructor(id, serverResponse) {
        /**
         * @type {string}
         */
        this.id = id;
        /**
         * @type {string}
         */
        this.name = serverResponse.name;
        /**
         * @type {string}
         */
        this.content = serverResponse.content.main;
        /**
         * @type {string[]}
         */
        this.imgs = serverResponse.content.imgs;
        /**
         * @type {Unknown[]}
         */
        this.unknowns = [];
        for (let i = 0; i < serverResponse.content.unknowns.length; i++) {
            const unknown = serverResponse.content.unknowns[i];
            this.unknowns.push(new Unknown(unknown[0], unknown[1]));
        }
    }

    /**
     * Converts EqEx unknowns to the server's format
     */
    convertUnknowns() {
        const result = {};
        this.unknowns.forEach(unknown => {
            result[unknown.name] = unknown.value;
        });
        return result;
    }
}