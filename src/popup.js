var parsedCalendar;
var schediuleURL = "https://academic-secretary.huji.ac.il/%D7%9C%D7%95%D7%97-%D7%90%D7%A7%D7%93%D7%9E%D7%99-%D7%9C%D7%A9%D7%A0%D7%AA-%D7%94%D7%9C%D7%99%D7%9E%D7%95%D7%93%D7%99%D7%9D-%D7%AA%D7%A9%D7%A4%D7%90-202021"
var year = "2021"; // NEED TO CHANGE THIS FOR NEXT YEAR
load();

document.addEventListener('DOMContentLoaded', function () {


});

function authorizeClicked(){
    isExams = document.getElementById('toggle_exams');
     isLessons = document.getElementById('toggle_lessons');
    if(isExams.checked && isLessons.checked){
        getExamEvents(parsedCalendar, handleClientLoad);
    }
    else if(isExams.checked){
        parsedCalendar.ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";
        parsedCalendar.eventList = [];
        getExamEvents(parsedCalendar, handleClientLoad)
    }
    else if(isLessons.checked){
        handleClientLoad();
    }
}

function downloadIcs(){
    isExams = document.getElementById('toggle_exams');
    isLessons = document.getElementById('toggle_lessons');
    if(isExams.checked && isLessons.checked){
        getExamEvents(parsedCalendar, downloadNow);
    }
    else if(isExams.checked){
        parsedCalendar.ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";
        parsedCalendar.eventList = [];
        getExamEvents(parsedCalendar, downloadNow)
    }
    else if(isLessons.checked){
        downloadNow();
    }
}

function downloadNow(){
    download_file('Calendar.ics', parsedCalendar.ics);
}

let exclusionDates = [];
let year_prefix = '20';
let dateDict = {
    "סמסטר א": {
        "יום א'": "SU",//"20191027",
        "יום ב'": "MO",//"20191028",
        "יום ג'": "TU",//"20191029",
        "יום ד'": "WE",//"20191030",
        "יום ה'": "TH",//"20191031",
        "יום ו'": "FR"//"20191101"
    },
    "שנתי": {
        "יום א'": "20191027",
        "יום ב'": "20191028",
        "יום ג'": "20191029",
        "יום ד'": "20191030",
        "יום ה'": "20191031",
        "יום ו'": "20191101",
        "יום ש'": ""
    },
    "סמסטר ב": {
        "יום א'": "20200315",
        "יום ב'": "20200316",
        "יום ג'": "20200317",
        "יום ד'": "20200318",
        "יום ה'": "20200319",
        "יום ו'": "20200320",
        "יום ש'": ""
    }
};


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == 'getCalendarInfo') {
            xhr = new XMLHttpRequest();
            xhr.open('GET', "https://cors-anywhere.herokuapp.com/" + schediuleURL);
            xhr.addEventListener('loadend', result=>parseCalendar(sendResponse, result));
            xhr.send();
            return true;  // Will respond asynchronously.
        }
        if(request.contentScriptQuery == 'gotCalendarInfo'){
            parsedCalendar = request.parsedCalendar;
            document.getElementById('loading').style.display='none';
            document.getElementById('btn_save').style.display='inline-block';
            document.getElementById('authorize_button').style.display='inline-block';
            document.getElementById('toggle_exams').style.display='inline-block';
            document.getElementById('toggle_exams_label').style.display='inline-block';
            document.getElementById('toggle_lessons').style.display='inline-block';
            document.getElementById('toggle_lessons_label').style.display='inline-block';
            document.getElementById('btn_save').addEventListener('click', downloadIcs);
            document.getElementById('authorize_button').addEventListener('click', authorizeClicked);

        }
    });
function parseCalendar(sendResponse, table){
    parsedCalendar = sendResponse(tableLoaded(table));

}
async function getExamEvents(parsedCalendar, after) {
    datevar = new Date();
    let exams = {};
    for(c in parsedCalendar['courses']){
        course = c;
        course_url = "https://cors-anywhere.herokuapp.com/http://shnaton.huji.ac.il/index.php?peula=Simple&starting=1&negishut=0&&faculty=0&prisa=2&word=&option=1&language=&shiur=&course=" + course + "&year=" + year;
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

            exam_url = 'https://cors-anywhere.herokuapp.com/http://shnaton.huji.ac.il/index.php?peula=CourseD&line=&year=' + year + '&detail=examDates&course=' + xcourse;
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
    chrome.tabs.executeScript({'file': 'src/xport.js'});


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
function tableLoaded(e){

    var parser = new DOMParser();

    var doc = parser.parseFromString(xhr.responseText, "text/html");
    table = doc.getElementsByTagName('table')[0];
    tableRows = table.getElementsByTagName('tr');
    let semesterAbeginsAt;
    let semesterAbeginsAtDates;
    let semesterAendsAt;
    let semesterAendsAtDates;
    let semesterBbeginsAt;
    let semesterBbeginsAtDates;
    let semesterBendsAt;
    let semesterBendsAtDates;
    let exclusionDate;
    let exclusionDateDates;
    for (row = 0; row < tableRows.length; row++) {

        eventName = tableRows[row].cells[0].textContent;
        if (eventName.includes("פתיחת שנת הלימודים")) {
            semesterAbeginsAt = tableRows[row].cells[2].textContent;
            semesterAbeginsAtDates = semesterAbeginsAt.split('.');

            semesterAbeginsAtDates[0] = makeTwoDigits(semesterAbeginsAtDates[0]);
            semesterAbeginsAtDates[1] = makeTwoDigits(semesterAbeginsAtDates[1]);
            semesterAbeginsAtDates[2] = makeTwoDigits(semesterAbeginsAtDates[2]);


            semesterAbeginsAt = year_prefix + semesterAbeginsAtDates[2] + semesterAbeginsAtDates[1] + semesterAbeginsAtDates[0];
            semesterAbeginsAt = semesterAbeginsAt.trim();
            findDays("סמסטר א", year_prefix + semesterAbeginsAtDates[2], semesterAbeginsAtDates[1], semesterAbeginsAtDates[0]);
            dateDict["שנתי"] = dateDict["סמסטר א"];

        }
        if (eventName.includes("סיום סמסטר א'")) {
            semesterAendsAt = tableRows[row].cells[2].textContent;
            semesterAendsAtDates = semesterAendsAt.split('.');

            semesterAendsAtDates[0] = makeTwoDigits(semesterAendsAtDates[0]);
            semesterAendsAtDates[1] = makeTwoDigits(semesterAendsAtDates[1]);
            semesterAendsAtDates[2] = makeTwoDigits(semesterAendsAtDates[2]);


            semesterAendsAt = year_prefix + semesterAendsAtDates[2] + semesterAendsAtDates[1] + semesterAendsAtDates[0];
            semesterAendsAt = semesterAendsAt.trim();
        }
        if (eventName.includes("פתיחת סמסטר ב'")) {
            semesterBbeginsAt = tableRows[row].cells[2].textContent;
            semesterBbeginsAtDates = semesterBbeginsAt.split('.');

            semesterBbeginsAtDates[0] = makeTwoDigits(semesterBbeginsAtDates[0]);
            semesterBbeginsAtDates[1] = makeTwoDigits(semesterBbeginsAtDates[1]);
            semesterBbeginsAtDates[2] = makeTwoDigits(semesterBbeginsAtDates[2]);

            semesterBbeginsAt = year_prefix + semesterBbeginsAtDates[2] + semesterBbeginsAtDates[1] + semesterBbeginsAtDates[0];
            semesterBbeginsAt = semesterBbeginsAt.trim();

            findDays("סמסטר ב", year_prefix + semesterBbeginsAtDates[2], semesterBbeginsAtDates[1], semesterBbeginsAtDates[0]);


        }
        if (eventName.includes("סיום סמסטר ב'")) {
            semesterBendsAt = tableRows[row].cells[2].textContent;
            semesterBendsAtDates = semesterBendsAt.split('.');

            semesterBendsAtDates[0] = makeTwoDigits(semesterBendsAtDates[0]);
            semesterBendsAtDates[1] = makeTwoDigits(semesterBendsAtDates[1]);
            semesterBendsAtDates[2] = makeTwoDigits(semesterBendsAtDates[2]);

            semesterBendsAt = year_prefix + semesterBendsAtDates[2] + semesterBendsAtDates[1] + semesterBendsAtDates[0];
            semesterBendsAt = semesterBendsAt.trim();
        }
        if (tableRows[row].cells.length >= 4 && tableRows[row].cells[3].textContent.includes("לא יתקיימו לימודים או בחינות")) {
            exclusionDate = tableRows[row].cells[2].textContent;

            // Parse which dates are to be excluded. this is fun.
            exclusionDate = exclusionDate.trim();
            dateRange = exclusionDate.split('-');
            if (dateRange.length > 1) {
                if (dateRange[0].split('.').length == 1) {
                    endRange = dateRange[1].split('.');
                    for (i = parseInt(dateRange[0]); i <= parseInt(endRange[0]); i++) {
                        ii = i.toString();

                        ii = makeTwoDigits(ii);
                        endRange[1] = makeTwoDigits(endRange[1]);
                        endRange[2] = makeTwoDigits(endRange[2]);

                        exclusionDate = year_prefix + endRange[2] + endRange[1] + ii;
                        exclusionDates.push(exclusionDate);
                    }
                } else {
                    startRange = dateRange[0].split('.');
                    endRange = dateRange[1].split('.');
                    if (parseInt(startRange[1]) < parseInt(endRange[1])) {
                        for (i = parseInt(startRange[0]); i < 32; i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);
                            startRange[1] = makeTwoDigits(startRange[1]);
                            endRange[2] = makeTwoDigits(endRange[2]);


                            exclusionDate = year_prefix + endRange[2] + startRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                        for (i = 1; i <= parseInt(endRange[0]); i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);
                            endRange[1] = makeTwoDigits(endRange[1]);
                            endRange[2] = makeTwoDigits(endRange[2]);


                            exclusionDate = year_prefix + endRange[2] + endRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                    } else {
                        for (i = parseInt(startRange[0]); i < parseInt(endRange[0]); i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);

                            startRange[1] = makeTwoDigits(startRange[1]);
                            endRange[2] = makeTwoDigits(endRange[2]);

                            exclusionDate = year_prefix + endRange[2] + startRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                    }
                }
            } else {
                exclusionDateDates = exclusionDate.split('.');
                exclusionDateDates[0] = makeTwoDigits(exclusionDateDates[0]);
                exclusionDateDates[1] = makeTwoDigits(exclusionDateDates[1]);
                exclusionDateDates[2] = makeTwoDigits(exclusionDateDates[2]);

                exclusionDate = year_prefix + exclusionDateDates[2] + exclusionDateDates[1] + exclusionDateDates[0];
                exclusionDate = exclusionDate.trim();
                exclusionDates.push(exclusionDate);
            }
        }
    }
    semesterInformation = {
        "סמסטר א": {
            start: semesterAbeginsAt,
            end: semesterAendsAt
        },
        "סמסטר ב": {
            start: semesterBbeginsAt,
            end: semesterBendsAt
        },
        "שנתי": {
            start: semesterAbeginsAt,
            end: semesterBendsAt
        }
    };
    return {semesterInformation:semesterInformation, exclusionDates:exclusionDates, dateDict:dateDict};
}
function findDays(semester, year, month, date) {
    datevar = new Date();
    datevar.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(date));
    datevar.setHours(11);
    day = datevar.getDay();

    daysDict = {
        0: "יום א'",
        1: "יום ב'",
        2: "יום ג'",
        3: "יום ד'",
        4: "יום ה'",
        5: "יום ו'",
        6: "יום ש'"
    };
    TWENTYFOURHOURS = 86400000;

    dateDict[semester][daysDict[day]] = year + month + date;
    for (i = 1; i < 7; i++) {
        datevarTime = datevar.getTime();
        datevar.setTime(datevarTime + TWENTYFOURHOURS);
        dateDict[semester][daysDict[(day + i) % 7]] = datevar.getFullYear().toString() + makeTwoDigits((datevar.getMonth() + 1).toString()) + makeTwoDigits(datevar.getDate().toString());
    }


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

function makeTwoDigits(number) {
    if(!number)
    {
       alert(new Error().stack);
    }
    number = number.trim();
    if (number.length < 2) {
        return '0' + number;
    }
    if (number.length === 4)
    {
        return number[2] + number[3]
    }
    return number;
}
//Error    at makeTwoDigits (chrome-extension://egggfnhegcafmnaklhgfbhdlecphmadk/src/popup.js:435:14)    at tableLoaded (chrome-extension://egggfnhegcafmnaklhgfbhdlecphmadk/src/popup.js:337:45)    at parseCalendar (chrome-extension://egggfnhegcafmnaklhgfbhdlecphmadk/src/popup.js:103:35)    at XMLHttpRequest.<anonymous> (chrome-extension://egggfnhegcafmnaklhgfbhdlecphmadk/src/popup.js:84:53)


