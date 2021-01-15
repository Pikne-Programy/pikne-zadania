//Imports
$.getScript('/helper/imports.js').then(() => {
    const urls = [
        '/helper/utils.js',
        '/index/model.js',
        'https://polyfill.io/v3/polyfill.min.js?features=es6',
        'https://cdn.jsdelivr.net/npm/mathjax@2/MathJax.js?config=TeX-MML-AM_CHTML-full'
    ];
    importScripts(urls, () => {
        $(() => {
            main();
        });
    });
});

/**
 * Main code of the controller. Must be executed after all dependencies have been imported.
 */
function main() {
    startModel(onMenuChanged, onExerciseLoaded);
    adjustView();
    let screenSize = getScreenSize();
    window.onresize = function() {
        const newScreenSize = getScreenSize();
        if (screenSize != newScreenSize) {
            screenSize = newScreenSize;
            adjustView(screenSize);
        }
    }
}


/**
 * Adjusts view according to current screen size
 * @param {('mobile' | 'tablet' | 'desktop' | 'widescreen' | 'fullhd')} screenSize 
 */
function adjustView(screenSize = getScreenSize()) {
    const classList = [
        new ToggleClasses('box', 'mobile-root-padding'),
        new ToggleClasses('hero-body', 'mobile-padding'),
        new ToggleClasses('title', 'is-4'),
        new ToggleClasses('subtitle', 'is-6')
    ];
    if (screenSize == 'mobile') {
        $('.mobile-changing').each((_, element) => {
            toggleClasses(element, classList, true);
        });

        $('#content').hide();
        $('#back_button').show();
    } else {
        $('.mobile-changing').each((_, element) => {
            toggleClasses(element, classList, false);
        });

        $('#content').show();
        $('#back_button').hide();
    }
}

/**
 * Updates view according to the current Menu
 */
function onMenuChanged() {
    const menu = currentMenu.get();
    if (menu != null) {
        $('#menu-list').empty();
        menu.children.forEach(child => {
            const element = createElement("a", ["menu-element"], [], child.value);
            const li = createElement("li", [], [element]);
            $(li).attr('tabIndex', 0);
            li.onclick = () => {
                if (child.select()) {
                    $('#breadcrumbs').children().each((_, node) => {
                        $(node).children().removeClass('is-active');
                        $(node).children().removeAttr('aria-current');
                    });
                    const a = createElement('a', ['is-active'], [], child.value);
                    $(a).attr('href', '#');
                    $(a).attr('aria-current', 'page');
                    const breadcrumb = createElement('li', [], [a])
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
        //$('#menu-loading').hide()

        toggleMenuLoading(false);
        $('#breadcrumbs').show();
        $('#menu-list').show();
    }
}

/**
 * Updates view according to the current selected Exercise
 */
function onExerciseLoaded() {
    if (currentExercise.get() != null) {

    }
}

/**
 * Selects provided Menu
 * @param {HTMLElement} element HTMLElement associated with the Menu
 * @param {TreeNode} menu Menu object
 */
function selectMenu(element, menu = exerciseTree) {
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