export function getBasePath() {
    //Fix for GH-Pages relative paths
    if (window.location.href.includes('pikne-programy.github.io'))
        return window.location.href.replace(/(.+)\//, '$1');
    else
        return '';
}