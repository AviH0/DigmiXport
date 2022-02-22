
/*
Entry point to add-on.
Should load any needed content scripts.
Should parse calendar info from huji academic calendar.

Once calendar info is parsed, it is send to content script to fetch courses.

Then events are created for lessons.
 */



let year = "";//"2022"; // NEED TO CHANGE THIS FOR NEXT YEAR


document.addEventListener('DOMContentLoaded', function () {
    setupRequestListener()
    setup_lessons_ready_listener()
    load();
});


let exclusionDates = [];
let year_prefix = '20';






async function getExamEvents(parsedCalendar, after) {
    datevar = new Date();
    let exams = {};
    for(c in parsedCalendar['courses']){
        course = c;
        course_url = "http://shnaton.huji.ac.il/index.php?peula=Simple&starting=1&negishut=0&&faculty=0&prisa=2&word=&option=1&language=&shiur=&course=" + course + "&year=" + year;
        var course_req = new XMLHttpRequest();
        course_req.open('GET', course_url);
        course_req.addEventListener('loadend', function(){
            var course_parser = new DOMParser();
            var course_doc = course_parser.parseFromString(this.responseText, "text/html");
            elements = course_doc.getElementsByClassName("courseTD text");
            exam_length = 0;
            var xcourse;
            for(element in elements) {
                if (elements[element].innerHTML == undefined){
                    continue;
                }
                if (elements[element].innerHTML.includes("&nbsp; | &nbsp;")) {
                    xcourse = elements[element].innerHTML.match(/\d+/);
                }
                if (elements[element].innerText.includes("משך הבחינה")) {
                    var get_length = /\d+.\d+/;
                    exam_length = parseFloat(elements[element].innerText.match(get_length));
                }
            }

            exam_url = 'http://shnaton.huji.ac.il/index.php?peula=CourseD&line=&year=' + year + '&detail=examDates&course=' + xcourse;
            var exam_list_req = new XMLHttpRequest();
            exam_list_req.open('POST', exam_url);
            exam_list_req.addEventListener('loadend', function () {
                var re = /\d+/;
                ccourse = this.responseText.match(re)[0];
                exams[ccourse] = [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(this.responseText, "text/html");
                examTable = doc.getElementsByClassName('courseTab_td');
                if (examTable != undefined) {
                    for (i = 0; i < examTable.length; i++) {
                        try {

                            examDate = examTable[i].innerText;
                            i++;
                            examHour = examTable[i].innerText;
                            i++;
                            examComments = examTable[i].innerText;
                            i++;
                            examLocation = examTable[i].innerText;
                            i++;
                            examMoed = examTable[i].innerText;
                            i++;
                            examSem = examTable[i].innerText;
                            exam = {
                                date: examDate,
                                time: examHour,
                                length: exam_length,
                                comments: examComments,
                                location: examLocation,
                                moed: examMoed,
                                semester: examSem,
                                course: ccourse
                            };
                            exams[ccourse].push(exam);
                        } catch (e) {
                            alert("Unknown problem while fetching exam dates, events might not be complete");
                            console.log(e);
                        }
                    }
                }
                else{
                    exams[ccourse].push({"noexam":{"null": true}});
                }
                if(Object.keys(exams).length == Object.keys(parsedCalendar['courses']).length){
                    parseExamDates(exams, after);
                }
            });
            exam_list_req.send();
        });
        course_req.send();

    }

}
function parseExamDates(exams, after) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            contentScriptQuery: 'getExamEvents',
            parsedCalendar: parsedCalendar,
            exams: exams
        },function(response) {gotExamEvents(response, after);});
    });
}

function gotExamEvents(newParsedCalendar, after){
    parsedCalendar = newParsedCalendar;
    if (newParsedCalendar.hasOwnProperty("message")){
        alert(newParsedCalendar.message);
    }
    after();
}

function load(e) {

    chrome.tabs.executeScript({'file': 'src/jquery-3.4.1.min.js'});
    chrome.tabs.executeScript({'file': 'src/jqueryui_1.8.18.js'});
    chrome.tabs.executeScript({'file': 'src/jquery.cookie.js'});
    chrome.tabs.executeScript({'file': 'src/content_script.js'});


}
function download_file(name, contents, mime_type) {
    mime_type = mime_type || "text/plain";

    var blob = new Blob([contents], {type: mime_type});

    var dlink = document.createElement('a');
    document.body.appendChild(dlink);
    dlink.download = name;
    dlink.href = window.URL.createObjectURL(blob);
    dlink.onclick = function (e) {
        // revokeObjectURL needs a delay to work properly
        var that = this;
        setTimeout(function () {
            window.URL.revokeObjectURL(that.href);
        }, 1500);
    };

    dlink.click();
    dlink.remove();
}


function getElementsByTagName(element, tagName) {
    var data = [];
    var descendants = element.getDescendants();
    for(i in descendants) {
        var elt = descendants[i].asElement();
        if( elt !=null && elt.getName()== tagName) data.push(elt);
    }
    return data;
}





