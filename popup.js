document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button').addEventListener('click', load);
});

let exclusionDates = [];
let dateDict;


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == 'getCalendarInfo') {
            xhr = new XMLHttpRequest();
            xhr.open('GET', "https://academic-secretary.huji.ac.il/%D7%9C%D7%95%D7%97-%D7%94%D7%A9%D7%A0%D7%94-%D7%94%D7%90%D7%A7%D7%93%D7%9E%D7%99%D7%AA");
            xhr.addEventListener('loadend', result=>sendResponse(tableLoaded(result)));
            xhr.send();
            return true;  // Will respond asynchronously.
        }
    });



function load(e) {

    chrome.tabs.executeScript({'file': 'jquery-3.4.1.min.js'});
    chrome.tabs.executeScript({'file': 'jqueryui_1.8.18.js'});
    chrome.tabs.executeScript({'file': 'jquery.cookie.js'});
    chrome.tabs.executeScript({'file': 'xport.js'});

}

function tableLoaded(e){

    var parser = new DOMParser();
    var doc = parser.parseFromString(xhr.responseText, "text/html");
    hujiTable = doc;
    table = hujiTable.getElementsByTagName('table')[0];
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
        if (tableRows[row].cells[3].textContent.includes("לא יתקיימו לימודים או בחינות")) {
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

                        exclusionDate = year_prefix + endRange[2] + endRange[1] + ii;
                        exclusionDates.push(exclusionDate);
                    }
                } else {
                    startRange = dateRange[0].split('.');
                    endRange = dateRange[1].split('.');
                    if (parseInt(startRange[0]) < parseInt(startRange[1])) {
                        for (i = parseInt(startRange[0]); i < 32; i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);
                            startRange[1] = makeTwoDigits(startRange[1]);

                            exclusionDate = year_prefix + startRange[2] + startRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                        for (i = 1; i <= parseInt(endRange[0]); i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);
                            endRange[1] = makeTwoDigits(endRange[1]);

                            exclusionDate = year_prefix + endRange[2] + endRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                    } else {
                        for (i = parseInt(startRange[0]); i < parseInt(endRange[0]); i++) {
                            ii = i.toString();

                            ii = makeTwoDigits(ii);
                            startRange[1] = makeTwoDigits(startRange[1]);

                            exclusionDate = year_prefix + startRange[2] + startRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                    }
                }
            } else {
                exclusionDateDates = exclusionDate.split('.');
                exclusionDateDates[0] = makeTwoDigits(exclusionDateDates[0]);
                exclusionDateDates[1] = makeTwoDigits(exclusionDateDates[1]);

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

function makeTwoDigits(number) {
    number = number.trim();
    if (number.length < 2) {
        return '0' + number;
    }
    return number;
}



