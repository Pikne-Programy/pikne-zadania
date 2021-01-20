export const ExerciseType = Object.freeze({
    EqEx: 1
})

/**
 * Imports every URL specified in the URL list
 * @param {string[]} urls List of URLs to import
 * @param {function} success Function to execute after successful import 
 */
export function importScripts(urls, success) {
    const promises = [];
    for (let i = 0; i < urls.length; i++) {
        promises.push($.getScript(urls[i], () => {
            console.log(urls[i] + ' loaded');
        }));
    }
    $.when.apply($, promises).then(() => {
        success();
    }, () => {
        console.log('import error');
    });
}

/**
 * Returns current screen size breakpoint:
 * @returns
 * 'mobile': 768px and less
 * 
 * 'tablet': 769px - 1023px
 * 
 * 'desktop': 1024px - 1215px
 * 
 * 'widescreen': 1216px - 1407px
 * 
 * 'fullhd': 1408px and more
 */
export function getScreenSize() {
    const width = window.innerWidth
    if (width <= 768)
        return 'mobile'
    else if (width <= 1023)
        return 'tablet'
    else if (width <= 1215)
        return 'desktop'
    else if (width <= 1407)
        return 'widescreen'
    else
        return 'fullhd'
}

/**
 * Returns if the device is used in touch mode
 */
export function isTouch() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

/**
 * Creates HTMLElement with provided classes, innerHTML & children
 * @param {string} type
 * @param {string[]} classes
 * @param {HTMLElement[]} children
 * @param {string} innerHTML
 */
export function createElement(type, classes = [], children = [], innerHTML = '') {
    const element = document.createElement(type);
    classes.forEach(className => {
        $(element).addClass(className);
    });
    $(element).html(innerHTML);
    children.forEach(child => {
        $(element).append(child);
    });
    return element;
}

/**
 * Sets visibility of a HTMLElement.
 * @param {HTMLElement} element
 * @param {('visible' | 'hidden' | 'collapse')} state 
 */
export function setVisibility(element, state) {
    $(element).css('visibility', state);
}

/**
 * Support class used in toggleClasses function
 * @see toggleClasses
 */
export class ToggleClasses {
    /**
     * @param {string} parent
     * @param {string} toToggle
     */
    constructor(parent, toToggle) {
        this.parent = parent;
        this.toToggle = toToggle;
    }
}

/**
 * Adds or removes each of toToggle class if provided element's class list contains parent class
 * @param {HTMLElement} element  
 * @param {ToggleClasses[]} toggleClassesList 
 * @param {boolean} add True - adds classes; False - removes classes
 */
export function toggleClasses(element, toggleClassesList, add) {
    toggleClassesList.forEach(toggleClass => {
        if (add) {
            if ($(element).hasClass(toggleClass.parent) && !$(element).hasClass(toggleClass.toToggle))
                $(element).addClass(toggleClass.toToggle);
        } else {
            if ($(element).hasClass(toggleClass.parent))
                $(element).removeClass(toggleClass.toToggle);
        }
    });
}

export class Observable {
    /**
     * Object with custom callback on value change
     * @param {any} initialValue Initially set value
     * @param {function} callback Function executed on value change
     * @class
     */
    constructor(initialValue = null, callback = null) {
        this.target = initialValue;
        this.callback = callback;
    }

    get() {
        return this.target;
    }
    set(val) {
        this.target = val;
        if (this.callback != null)
            this.callback();
    };
}

/**
 * Capitalizes first letter of the string
 * @param {string} string Text to be capitalized
 * @param {string} locale Used Locale
 */
export function capitalize(string, locale = navigator.language) {
    if (string == null || string == undefined)
        return string;
    else
        return string.charAt(0).toLocaleUpperCase(locale) + string.slice(1);
}

(function($) {
    /**
     * Removes all old classes and adds all new classes
     * @param {string[]} oldClasses Classes to remove
     * @param {string[]} newClasses Classes to add
     */
    $.fn.replaceClasses = function(oldClasses, newClasses) {
        oldClasses.forEach((oldClass) => {
            this.removeClass(oldClass);
        });
        newClasses.forEach((newClass) => {
            if (!this.hasClass(newClass))
                this.addClass(newClass);
        });
    }
})(jQuery);