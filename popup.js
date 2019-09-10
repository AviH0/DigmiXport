document.getElementById("btn_save").setAttribute("onClick", "load()");
function load() {
    chrome.tabs.executeScript({'file': 'xport.js'});

}