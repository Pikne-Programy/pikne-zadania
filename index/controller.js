import * as Utils from '../helper/utils.js';
import * as ControllerUtils from '../helper/controller-utils.js';
import * as Model from './model.js';
import * as EqEx from '../eqex/controller.js';

let currentExerciseController = null;

/**
 * Starts main when all scripts have been loaded
 */
export function startOnLoad() {
    adjustView();
    $(() => {
        main();
    });
}

/**
 * Main code of the controller. Must be executed after all dependencies have been imported.
 */
function main() {
    Model.startModel(onSubjectsLoaded, onMenuChanged, onExerciseLoaded);
    let screenSize = Utils.getScreenSize();
    toggleHeaderAndFooter(screenSize);
    $(window).on('resize', () => {
        const newScreenSize = Utils.getScreenSize();
        if (screenSize != newScreenSize) {
            screenSize = newScreenSize;
            adjustView(screenSize);
        }
        toggleHeaderAndFooter(screenSize);
        onSubjectsLoaded(true);
        onMenuChanged(true);
    });
    $('#back-button').on('click', () => {
        clearCurrentExercise();
        $('#menu').show();
        $('#content').hide();
    });
    ControllerUtils.setOnClickOrEnterListener('#page-tab-home', () => {
        $('#section-exercise-list').hide();
        $('#section-subject-list').show();
        onSubjectsLoaded(true);
        clearCurrentExercise();
        Model.selectSubject(null);
    });
}

/**
 * Shows or hides header and footer depending on screen size
 */
function toggleHeaderAndFooter() {
    if (window.innerHeight <= 450) {
        $('.hero').hide();
        $('footer').hide();
    }
    else {
        $('.hero').show();
        if ($('.navbar').find('.navbar-menu').css('display') == 'none')
            $('footer').show();
        else
            $('footer').hide();
    }
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
        $('#back-button').parent().parent().show();
        $('footer').show();
    } else {
        $('.mobile-changing').each((_, element) => {
            Utils.toggleClasses(element, classList, false);
        });

        $('#menu').show()
        $('#content').show();
        $('#back-button').parent().parent().hide();
        $('footer').hide();
    }
}

/**
 * Populates Panel with elements from subject list
 * @param {boolean} update Determines if subject list changed or the view is just being updated
 */
function onSubjectsLoaded(update = false) {
    const subjectPanel = $('#panel-subjects');
    const container = subjectPanel.find('nav');
    if (!update) {
        const subjectList = Model.subjectList.get();
        container.empty();
        subjectList.forEach(subject => {
            container.append(createSubjectPanelElement(subject.name));
        });
        subjectPanel.find('progress').parent().removeClass('is-flex');
        container.show();
    }
}

/**
 * Creates a HTMLElement for subject Panel
 * @param {string} subjectName Name of the subject
 */
function createSubjectPanelElement(subjectName) {
    const icon = Utils.createElement('i', ['fas', 'fa-book']);
    $(icon).attr('aria-hidden', 'true');
    const iconSpan = Utils.createElement('span', ['panel-icon'], [icon]);
    const nameSpan = Utils.createElement('span', [], [], Utils.capitalize(subjectName))
    const a = Utils.createElement('a', ['panel-block'], [iconSpan, nameSpan]);
    $(a).attr('tabIndex', '0');
    ControllerUtils.setOnClickOrEnterListener(a, () => {
        $('#menu-home').find('span').last().html(Utils.capitalize(subjectName));
        $('#section-subject-list').hide();
        $('#section-exercise-list').show();
        const i = $(a).index();
        Model.selectSubject(i)
    });
    return a;
}

/**
 * Updates view according to the current Menu
 * @param {boolean} update Determines if Menu changed or is just being updated
 */
function onMenuChanged(update = false) {
    ControllerUtils.toggleMenuLoading(true);
    const selectedPos = $('#menu-list').find('.is-active').parent().index();
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
            const element = Utils.createElement('a', ['menu-element'], [], child.value);
            const li = Utils.createElement('li', [], [element]);
            $(li).attr('tabIndex', 0);
            ControllerUtils.setOnClickOrEnterListener(li, () => {
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
            });
            $('#menu-list').append(li);
        });
        if (selectedPos > -1 && update)
            $('#menu-list').children().eq(selectedPos).children().addClass('is-active');

        ControllerUtils.toggleMenuLoading(false);
        $('#breadcrumbs').parent().show();
        $('#menu-list').show();
    }
}

/**
 * Updates view according to the current selected Exercise
 */
function onExerciseLoaded() {
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
    if ($(element).next().length != 0) {
        menu.select();
        $(element).nextAll().remove();
    }
}

function clearCurrentExercise() {
    if (currentExerciseController != null)
        currentExerciseController.abort();
    currentExerciseController = null;
    Model.clearCurrentExercise();
    ControllerUtils.toggleContentLoading(null);
    $('#menu-list').children().children().removeClass('is-active');
}