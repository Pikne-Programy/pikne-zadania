/**
 * Imports every URL specified in the URL list
 * @param {string[]} urls List of URLs to import
 * @param {function} success Function to execute after successful import 
 */
function importScripts(urls, success) {
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