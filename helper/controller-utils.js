import * as Utils from './utils.js';

/**
 * Shows or hides loading progress bar for Menu
 * @param {boolean} state True - shows progress bar; False - hides progress bar
 */
export function toggleMenuLoading(state) {
    if (state) {
        $('#menu-loading').addClass('is-flex');
        $('#menu-loading').show();
    } else {
        $('#menu-loading').hide();
        $('#menu-loading').removeClass('is-flex');
    }
}

/**
 * Shows or hides loading progress bar for Content
 * @param {boolean} state True - shows progress bar; False - shows content; Null - shows content placeholder
 */
export function toggleContentLoading(state) {
    $('#content').show();
    if (state == true) {
        $('#content-menu').hide();
        $('#content-menu').removeClass('is-flex');
        $('#content-container').hide();
        if (!$('#content-loading').hasClass('is-flex'))
            $('#content-loading').addClass('is-flex');
        $('#content-loading').show();
    } else if (state == false) {
        $('#content-menu').hide();
        $('#content-menu').removeClass('is-flex');
        $('#content-loading').hide();
        $('#content-loading').removeClass('is-flex');
        $('#content-container').show();
    } else {
        $('#content-loading').hide();
        $('#content-loading').removeClass('is-flex');
        $('#content-container').hide();
        if (!$('#content-menu').hasClass('is-flex'))
            $('#content-menu').addClass('is-flex');
        $('#content-menu').show();
    }
}

/**
 * Sets value checking for input view
 * @param {RegExp} regex Regex by which input is tested
 * @param {HTMLElement} input Input view
 */
export function setInputChecking(regex, input) {
    ['input', 'keydown', 'keyup', 'keypress', 'drop'].forEach((event) => {
        input.addEventListener(event, () => {
            clearInputVerifiedStated('#ex-unknowns');

            const isCorrect = regex.test(input.value);
            if (isCorrect) {
                $(input).removeClass('is-warning');
                $(input).parent().find('span').hide();
            } else {
                if (!$(input).hasClass('is-warning'))
                    $(input).addClass('is-warning');
                $(input).parent().find('span').show();
            }

            $(input).parent().parent().find('p').each((_, label) => {
                Utils.setVisibility(label, isCorrect ? 'hidden' : 'visible');
            });
            toggleSubmitButton(regex);
        });
    });
}

/**
 * Enables (or disables) submit button if inputs match provided regex
 * @param {RegExp} regex Regex by which inputs are tested
 */
function toggleSubmitButton(regex) {
    let isCorrect = true;
    $('#ex-unknowns').find('input').each((_, input) => {
        if (!regex.test(input.value)) {
            isCorrect = false;
            return;
        }
    });
    if (isCorrect)
        $('#submit-button').removeAttr('disabled');
    else
        $('#submit-button').attr('disabled', 'true');
}

/**
 * Highlights (or removes highlight) for input view
 * @param {HTMLElement} input Input view
 * @param {boolean} state True - success; False - danger
 */
export function setInputVerifiedState(input, state) {
    const span = $(input).parent().find('span');
    $(input).addClass(state ? 'is-success' : 'is-danger');
    span.replaceClasses(['has-text-warning'], state ? ['has-text-success'] : ['has-text-danger']);
    span.find('i').replaceClasses(['fa-exclamation-triangle'], state ? ['fa-check'] : ['fa-times']);
    span.show();
}

/**
 * Highlights (or removes highlight) for inputs
 * @param {(HTMLElement | string)} container Parent of input views (if string - JQUERY selector)
 */
export function clearInputVerifiedStated(container) {
    $(container).find('input').each((_, input) => {
        $(input).removeClass('is-success is-danger');
        const span = $(input).parent().find('span');
        span.replaceClasses(['has-text-success', 'has-text-danger'], ['has-text-warning']);
        const i = span.find('i');
        i.replaceClasses(['fa-check', 'fa-times'], ['fa-exclamation-triangle'])
        if (!$(input).hasClass('is-warning'))
            span.hide();
    });
}

/**
 * Sets listener for click or enter key press on the provided element
 * @param {(HTMLElement | string)} element HTMLElement or JQuery selector
 * @param {function} callback Function executed on click
 */
export function setOnClickOrEnterListener(element, callback) {
    ['click', 'keydown'].forEach((eventName) => {
        $(element).on(eventName, (event) => {
            if (eventName != 'keydown' || event.which == 13) {
                callback();
            }
        });
    });
}