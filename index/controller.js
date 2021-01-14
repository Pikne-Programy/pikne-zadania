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
    startModel(onListLoaded, onExerciseLoaded);
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

function onListLoaded() {
    if (exerciseList.get() != null) {
        console.log('new list')
    }
}

function onExerciseLoaded() {
    if (currentExercise.get() != null) {

    }
}