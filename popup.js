
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button').addEventListener('click', load);
});
function load(e) {

    chrome.tabs.executeScript({'file': 'jquery-3.4.1.min.js'});
    chrome.tabs.executeScript({'file': 'jqueryui_1.8.18.js'});
    chrome.tabs.executeScript({'file': 'jquery.cookie.js'});
    chrome.tabs.executeScript({'file': 'xport.js'});

}