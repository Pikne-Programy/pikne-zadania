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
 * @param {boolean} state True - shows progress bar; False - shows content; Null - shows content menu
 */
export function toggleContentLoading(state) {
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
 * Sets value checking for 
 * @param {RegExp} regex Regex by which input is tested
 * @param {HTMLElement} input Input view
 * @param {HTMLElement?} label Label view with text of the warning
 */
export function setInputChecking(regex, input, label = null) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach((event) => {
        input.addEventListener(event, () => {
            const isCorrect = regex.test(input.value);
            //$(input).toggleClass('is-primary');
            if (isCorrect)
                $(input).removeClass('is-warning');
            else if (!$(input).hasClass('is-warning'))
                $(input).addClass('is-warning');
            //$(input).toggleClass('is-warning');
            if (label != null) {
                if (isCorrect)
                    Utils.setVisibility(label, 'hidden');
                else
                    Utils.setVisibility(label, 'visible');
            } else {
                console.log('label null');
            }
        });
    });
}