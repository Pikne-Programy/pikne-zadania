import * as Utils from '../helper/utils.js';
import * as Model from './model.js';

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
    window.onresize = function() {
        const newScreenSize = Utils.getScreenSize();
        if (screenSize != newScreenSize) {
            screenSize = newScreenSize;
            adjustView(screenSize);
        }
        onMenuChanged(true);
    }
}

/**
 * Adjusts view according to current screen size
 * @param {('mobile' | 'tablet' | 'desktop' | 'widescreen' | 'fullhd')} screenSize 
 */
function adjustView(screenSize = Utils.getScreenSize()) {
    const classList = [
        new Utils.ToggleClasses('box', 'mobile-root-padding'),
        new Utils.ToggleClasses('hero-body', 'mobile-padding'),
        new Utils.ToggleClasses('title', 'is-4'),
        new Utils.ToggleClasses('subtitle', 'is-6')
    ];
    if (screenSize == 'mobile') {
        $('.mobile-changing').each((_, element) => {
            Utils.toggleClasses(element, classList, true);
        });

        $('#content').hide();
        $('#back_button').show();
    } else {
        $('.mobile-changing').each((_, element) => {
            Utils.toggleClasses(element, classList, false);
        });

        $('#content').show();
        $('#back_button').hide();
    }
}

/**
 * Updates view according to the current Menu
 * @param {boolean} update Determines if Menu changed or is just being updated
 */
function onMenuChanged(update = false) {
    toggleMenuLoading(true);
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
            li.onclick = () => {
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
                }
            }
            $('#menu-list').append(li);
        });
        if (selectedPos > -1 && update)
            $('#menu-list').children().eq(selectedPos).children().addClass('is-active');

        toggleMenuLoading(false);
        $('#breadcrumbs').parent().show();
        $('#menu-list').show();
        $('#menu-list-container').setCustomScrollbars({
            autohide: !Utils.isTouch(),
            padding: 10
        });
        if (update)
            $('#menu-list-container').scrollToPosition(initPos);
    }
}

/**
 * Updates view according to the current selected Exercise
 */
function onExerciseLoaded() {
    if (Model.currentExercise.get() != null) {

    }
}

/**
 * Selects provided Menu
 * @param {HTMLElement} element HTMLElement associated with the Menu
 * @param {Model.TreeNode} menu Menu object
 */
function selectMenu(element, menu = Model.exerciseTree) {
    menu.select();
    $(element).nextAll().remove();
}

/**
 * Shows or hides loading progress bar for Menu
 * @param {boolean} state True - shows progress bar; False - hides progress bar
 */
function toggleMenuLoading(state) {
    if (state) {
        $('#menu-loading').add('is-flex');
        $('#menu-loading').show();
    } else {
        $('#menu-loading').hide();
        $('#menu-loading').removeClass('is-flex');
    }
}