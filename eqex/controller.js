import * as Utils from '../helper/utils.js';
import * as ControllerUtils from '../helper/controller-utils.js';
import * as Model from './model.js';
import { getBasePath } from '../helper/tests/path-manager.js'

export class Controller {
    isAborted = false;

    /**
     * Sets up view for Equation Exercise
     * @param {Model.EquationExercise} exercise Fetched EqEx exercise
     */
    constructor(exercise) {
        $('#content-container').clearCustomScrollbars();
        Model.startModel(exercise);
        const container = Utils.createElement('div');
        $(container).load(getBasePath() + '/eqex/eqex.html', () => {
            if (!this.isAborted) {
                bindView(container);
                if (!this.isAborted) {
                    $('#content-container').empty();
                    $('#content-container').append($(container).children())
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, 'math-panel'], [() => {
                        ControllerUtils.toggleContentLoading(false);
                        $('#content-container').setCustomScrollbars({
                            autohide: !Utils.isTouch(),
                            padding: 10
                        });
                    }]);
                }
            }
        });
        $(window).on('resize', () => {
            const container = $('#content-container');
            const initPos = container.clearCustomScrollbars();
            container.setCustomScrollbars({
                autohide: !Utils.isTouch(),
                padding: 10
            });
            container.scrollToPosition(initPos);
        });
    }

    abort() {
        this.isAborted = true;
    }
}

/**
 * Sets data according to the current EqEx
 * @param {HTMLElement} container View with fields for EqEx
 */
function bindView(container) {
    $(container).find('#ex-title').text(Model.exercise.name);
    $(container).find('#ex-content').text(Model.exercise.content);
    Model.exercise.imgs.forEach(url => {
        $(container).find('#ex-image-container').append(createImage(url));
    });
    Model.exercise.unknowns.forEach(unknown => {
        $(container).find('#ex-unknowns').append(createUnknown(unknown.name, unknown.unit));
    });
}

/**
 * Appends view with an image
 * @param {string} url URL of the image
 */
function createImage(url) {
    const img = Utils.createElement('img', ['img']);
    img.src = url;
    const figure = Utils.createElement('div', ['full-height', 'is-flex', 'is-align-items-center', 'is-justify-content-center'], [img]);
    const box = Utils.createElement('div', ['box', 'full-height', 'p-0'], [figure]);
    const column = Utils.createElement('div', ['column'], [box]);
    return column;
}

/**
 * Creates view for submitting an unknown
 * @param {string} name Name of the unknown
 * @param {string} unit Unit of the unknown
 */
function createUnknown(name, unit) {
    const input = Utils.createElement('input', ['input', 'is-primary']);
    const warningLabel = Utils.createElement('p', ['help', 'is-warning'], [], 'Wymagana liczba');
    Utils.setVisibility(warningLabel, 'hidden');
    ControllerUtils.setInputChecking(Model.inputRegex, input, warningLabel);
    const nameLabel = Utils.createElement('div', ['subtitle', 'full-height', 'unknowns-width', 'is-flex', 'is-align-items-center', 'is-justify-content-right'], [], '\\(' + name + '=\\)');
    const unitLabel = Utils.createElement('div', ['subtitle', 'full-height', 'unknowns-width', 'is-flex', 'is-align-items-center'], [], '\\(' + unit + '\\)');

    const nameColumn = Utils.createElement('div', ['column', 'is-narrow', 'pb-5-5'], [nameLabel]);
    const inputColumn = Utils.createElement('div', ['column', 'px-0'], [input, warningLabel]);
    const unitColumn = Utils.createElement('div', ['column', 'is-narrow', 'pb-5-5'], [unitLabel]);

    const columns = Utils.createElement('div', ['columns', 'is-mobile'], [nameColumn, inputColumn, unitColumn]);
    const tile = Utils.createElement('div', ['tile', 'column', 'is-flex', 'is-justify-content-center', 'pt-0', 'pb-2'], [columns]);
    return tile;
}