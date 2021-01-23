import * as Utils from '../helper/utils.js';
import * as ControllerUtils from '../helper/controller-utils.js';
import * as Model from './model.js';
import * as EqEx from '../eqex/controller.js';

let currentExerciseController = null;

/**
 * Imports dependencies of the controller from CDN and starts main
 */
export function importDependencies() {
    Utils.importScripts([
        'https://polyfill.io/v3/polyfill.min.js?features=es6',
        'https://cdn.jsdelivr.net/npm/mathjax@2/MathJax.js?config=TeX-MML-AM_CHTML-full'
    ], () => {
        $(() => {
            main();
        });
    });
}

/**
 * Main code of the controller. Must be executed after all dependencies have been imported.
 */
export function main() {
    Model.startModel(onMenuChanged, onExerciseLoaded);
    adjustView();
    let screenSize = Utils.getScreenSize();
    $(window).on('resize', () => {
        const newScreenSize = Utils.getScreenSize();
        if (screenSize != newScreenSize) {
            screenSize = newScreenSize;
            adjustView(screenSize);
        }
        if (window.innerHeight <= 450)
            $('.hero').hide();
        else
            $('.hero').show();
        onMenuChanged(true);
    });
    $('#home-button').on('click', () => {
        clearCurrentExercise();
    });
    $('#back-button').on('click', () => {
        clearCurrentExercise();
        $('#menu').show();
        $('#content').hide();
    });
}

/**
 * Adjusts view according to current screen size
 * @param {Utils.ScreenSize} screenSize 
 */
function adjustView(screenSize = Utils.getScreenSize()) {
    const classList = [
        new Utils.ToggleClasses('box', 'mobile-root-padding'),
        new Utils.ToggleClasses('hero-body', 'mobile-padding'),
        new Utils.ToggleClasses('title', 'is-4'),
        new Utils.ToggleClasses('subtitle', 'is-6')
    ];
    if (screenSize == Utils.ScreenSize.MOBILE) {
        $('.mobile-changing').each((_, element) => {
            Utils.toggleClasses(element, classList, true);
        });

        if (currentExerciseController == null)
            $('#content').hide();
        else
            $('#menu').hide()
        $('#home-button').parent().hide();
        $('#back-button').show();
    } else {
        $('.mobile-changing').each((_, element) => {
            Utils.toggleClasses(element, classList, false);
        });

        $('#menu').show()
        $('#content').show();
        $('#home-button').parent().show();
        $('#back-button').hide();
    }
}

/**
 * Updates view according to the current Menu
 * @param {boolean} update Determines if Menu changed or is just being updated
 */
function onMenuChanged(update = false) {
    ControllerUtils.toggleMenuLoading(true);
    const selectedPos = $('#menu-list').find('.is-active').parent().index();
    const initPos = $('#menu-list-container').clearCustomScrollbars();
    const home = document.getElementById('menu-home');
    if (home.onclick == null) {
        home.onclick = () => {
            selectMenu(home, Model.exerciseTree);
        };
    }

    const menu = Model.currentMenu.get();
    if (menu != null) {
        $('#menu-list').empty();
        menu.children.forEach(child => {
            const element = Utils.createElement("a", ["menu-element"], [], child.value);
            const li = Utils.createElement("li", [], [element]);
            $(li).attr('tabIndex', 0);
            ['click', 'keydown'].forEach((eventName) => {
                $(li).on(eventName, (event) => {
                    if (eventName != 'keydown' || event.which == 13) {
                        if (child.select()) {
                            $('#breadcrumbs').children().each((_, node) => {
                                $(node).children().removeClass('is-active');
                                $(node).children().removeAttr('aria-current');
                            });
                            const a = Utils.createElement('a', ['is-active'], [], child.value);
                            $(a).attr('aria-current', 'page');
                            const breadcrumb = Utils.createElement('li', [], [a])
                            breadcrumb.onclick = () => {
                                selectMenu(breadcrumb, child);
                            }
                            $('#breadcrumbs').append(breadcrumb);
                        } else {
                            $('#menu-list').children().children().removeClass('is-active');
                            $(li).children().addClass('is-active');
                            ControllerUtils.toggleContentLoading(true);
                            if (Utils.getScreenSize() == Utils.ScreenSize.MOBILE)
                                $('#menu').hide();
                        }
                    }
                });
            });
            $('#menu-list').append(li);
        });
        if (selectedPos > -1 && update)
            $('#menu-list').children().eq(selectedPos).children().addClass('is-active');

        ControllerUtils.toggleMenuLoading(false);
        $('#breadcrumbs').parent().show();
        $('#menu-list').show();
        if (!Utils.isTouch()) {
            $('#menu-list-container').setCustomScrollbars({
                autohide: true,
                padding: 10
            });
        }
        if (update)
            $('#menu-list-container').scrollToPosition(initPos);
    }
}

/**
 * Updates view according to the current selected Exercise
 */
function onExerciseLoaded() {
    $('#content-container').clearCustomScrollbars();
    const exercise = Model.currentExercise.get();
    if (exercise != null) {
        if (currentExerciseController != null)
            currentExerciseController.abort();
        switch (exercise.type) {
            case Utils.ExerciseType.EqEx:
                currentExerciseController = new EqEx.Controller(exercise);
                break;
        }
    } else
        ControllerUtils.toggleContentLoading(null);
}

/**
 * Selects provided Menu
 * @param {HTMLElement} element Breadcrumb associated with the Menu
 * @param {Model.TreeNode} menu Menu object
 */
function selectMenu(element, menu = Model.exerciseTree) {
    menu.select();
    $(element).nextAll().remove();
}

function clearCurrentExercise() {
    if (currentExerciseController != null)
        currentExerciseController.abort();
    currentExerciseController = null;
    Model.clearCurrentExercise();
    ControllerUtils.toggleContentLoading(null);
    $('#menu-list').children().children().removeClass('is-active');
}