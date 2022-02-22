const CALENDAR_INFO_REQUEST = 'getCalendarInfo';
const ACADEMIC_CAL_URL = "https://academic-secretary.huji.ac.il/%D7%9C%D7%95%D7%97-%D7%A9%D7%A0%D7%94-%D7%90%D7%A7%D7%93%D7%9E%D7%99?tab-active=0"




function setupRequestListener()
{
    chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery === CALENDAR_INFO_REQUEST) {
            year = request.year
            xhr = new XMLHttpRequest();
            xhr.open('GET', ACADEMIC_CAL_URL);
            xhr.addEventListener('loadend', result=>parseCalendar(sendResponse, xhr));
            xhr.send();
            return true;  // Will respond asynchronously.
        }
});
}


function parseCalendar(callback, xhr){
    callback(parse_cal_dom(xhr.responseText));
}

function parse_cal_dom(academic_cal_dom){

    let parser = new DOMParser();

    let doc = parser.parseFromString(academic_cal_dom, "text/html");
    let current_year_id = doc.querySelectorAll('.tab-links [class*=" first"]')[0].getElementsByTagName('a')[0].getAttribute('href').substr(1)

    tables = doc.getElementById(current_year_id).getElementsByTagName("table")

    tableRows = Array.from(tables[0].getElementsByTagName('tr')).concat(Array.from(tables[1].getElementsByTagName('tr')))

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

    let dateDict = {
    "סמסטר א": {
        "יום א'": "",
        "יום ב'": "",
        "יום ג'": "",
        "יום ד'": "",
        "יום ה'": "",
        "יום ו'": ""
    },
    "שנתי": {
        "יום א'": "",
        "יום ב'": "",
        "יום ג'": "",
        "יום ד'": "",
        "יום ה'": "",
        "יום ו'": "",
        "יום ש'": ""
    },
    "סמסטר ב": {
        "יום א'": "",
        "יום ב'": "",
        "יום ג'": "",
        "יום ד'": "",
        "יום ה'": "",
        "יום ו'": "",
        "יום ש'": ""
    }
};


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
            findDays("סמסטר א", year_prefix + semesterAbeginsAtDates[2], semesterAbeginsAtDates[1], semesterAbeginsAtDates[0], dateDict);
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

            findDays("סמסטר ב", year_prefix + semesterBbeginsAtDates[2], semesterBbeginsAtDates[1], semesterBbeginsAtDates[0], dateDict);


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

function findDays(semester, year, month, date, date_dict) {
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

    date_dict[semester][daysDict[day]] = year + month + date;
    for (i = 1; i < 7; i++) {
        datevarTime = datevar.getTime();
        datevar.setTime(datevarTime + TWENTYFOURHOURS);
        date_dict[semester][daysDict[(day + i) % 7]] = datevar.getFullYear().toString() + makeTwoDigits((datevar.getMonth() + 1).toString()) + makeTwoDigits(datevar.getDate().toString());
    }
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