
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button').addEventListener('click', load);
});
function load(e) {

    chrome.tabs.executeScript({'file': 'xport.js'});

}