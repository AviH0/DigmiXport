var year = 2020;
var year_prefix = '20'; // Change if next century.
var exclusionDates = [];
var eventsForGoogle = [];
var currentEventIndex = 0;
var coursesAndSemesters = {};


var dateDict = {
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
var semesterInformation = {
    "סמסטר א": {
        "start": "",
        "end": "20200128"
    },
    "סמסטר ב": {
        "start": "",
        "end": "20200730"
    },
    "שנתי": {
        "start": "",
        "end": "20200128"
    }
};
var courseSemesterToExamSemester = {
    "סמסטר א": "סמסטר א",
    "סמסטר ב": "סמסטר ב",
    "שנתי": "סמסטר ב"

}


var lessonTypeDict = {
    "תרג": "תרגול",
    "שעור": "הרצאה",
    "שות": "שות",
    "סדנה": "סדנה",
    "מעב": "מעבדה"
};


chrome.runtime.sendMessage(
    {contentScriptQuery: 'getCalendarInfo'}, response => tableRecieved(response));

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == 'getExamEvents') {
            parsedCalendarFromReq = request.parsedCalendar;
            exams = request.exams;
            parsedCalendarFromReq.ics = parsedCalendarFromReq.ics.replace("END:VCALENDAR", "");
            var all_exam_times_set = true;
            for (course in exams) {
                var courseExams = {};
                for (exam in exams[course]) {
                    var wantedSemester = coursesAndSemesters[course].semester;
                    var course_name = coursesAndSemesters[course].name;
                    if (exams[course][exam].semester != wantedSemester) {
                        break;
                    }
                    if (!courseExams.hasOwnProperty(exams[course][exam].moed)) {
                        eDate = exams[course][exam].date;
                        eYear = eDate.substring(6, 10);
                        eMonth = eDate.substring(3, 5);
                        eDay = eDate.substring(0, 2);
                        eDate = eYear + '-' + eMonth + '-' + eDay;
                        if (exams[course][exam].time.match(/\d\d:\d\d/) == null) {
                            exams[course][exam].time = "00:00";
                        }
                        dateTimeStart = eDate + 'T' + exams[course][exam].time + ':00';
                        dateVar = new Date(dateTimeStart);
                        THREEHOURS = 10800000;
                        ONEHOUR = THREEHOURS/3;
                        length_of_exam = exams[course][exam].length * ONEHOUR;
                        endDateVar = new Date(dateVar.getTime() + length_of_exam);
                        dateTimeEnd = endDateVar.getFullYear() + '-' + makeTwoDigits(endDateVar.getMonth()+1) + '-' + makeTwoDigits(endDateVar.getDate()) + 'T' + makeTwoDigits(endDateVar.getHours()) + ':' + makeTwoDigits(endDateVar.getMinutes())+':00';
                        summary = course_name + '(' + exams[course][exam].course + "): " + exams[course][exam].semester + exams[course][exam].moed;
                        courseExams[exams[course][exam].moed] = {
                            gEvent: {
                                'end': {
                                    'dateTime': dateTimeEnd,
                                    "timeZone": "Asia/Jerusalem"
                                },
                                'start': {
                                    'dateTime': dateTimeStart,
                                    "timeZone": "Asia/Jerusalem"
                                },
                                'location': exams[course][exam].comments + ": " + exams[course][exam].location + '\n',
                                'summary': summary,
                            }
                        };
                        start = dateTimeStart.replace(/-/g, "").replace(/:/g, "");
                        end = dateTimeEnd.replace(/-/g, "").replace(/:/g, "").replace(/\.000/, "");
                        courseExams[exams[course][exam].moed]['iEvent'] = {
                            DTSTART: "DTSTART;TZID=Asia/Jerusalem:" + start + "Z\n",
                            DTEND: "DTEND;TZID=Asia/Jerusalem:" + end + "\n",
                            SUMMARY: "SUMMARY:" + summary + "\n",
                            LOCATION: "LOCATION:" + exams[course][exam].comments + ": " + exams[course][exam].location + '\n',
                        }
                    } else {
                        courseExams[exams[course][exam].moed].iEvent.LOCATION += exams[course][exam].comments + ": " + exams[course][exam].location + '\n';
                        courseExams[exams[course][exam].moed].gEvent.location += exams[course][exam].comments + ": " + exams[course][exam].location + '\n';
                    }
                }
                for (moed in courseExams) {
                    parsedCalendarFromReq.eventList.push(courseExams[moed].gEvent);
                    var result = "BEGIN:VEVENT\n";
                    result += courseExams[moed].iEvent.DTSTART;
                    result += courseExams[moed].iEvent.DTEND;
                    result += courseExams[moed].iEvent.SUMMARY;
                    result += courseExams[moed].iEvent.LOCATION;
                    result += "END:VEVENT\n";
                    parsedCalendarFromReq.ics += result;
                }
                // var result = "BEGIN:VEVENT\n";
                // result += "DTSTART;TZID=Asia/Jerusalem:" + start + "Z\n";
                // result += "DTEND;TZID=Asia/Jerusalem:" + end + "\n";
                // result += "SUMMARY:" + summary + "\n";
                // result += "LOCATION:" + exams[course][exam].location + '\n' + exams[course][exam].comments + "\n";
                // result += "END:VEVENT\n";
                // parsedCalendarFromReq.ics += result;
            }
            parsedCalendarFromReq.ics += "END:VCALENDAR";
            sendResponse(parsedCalendarFromReq);
        }
        // return true;  // Will respond asynchronously.
    });

function tableRecieved(packedStuff) {

    semInfo = [];
    for (inf in packedStuff.semesterInformation) {
        semInfo.push(packedStuff.semesterInformation[inf]);
    }
    semesterInformation["סמסטר א"] = semInfo[0];
    semesterInformation["סמסטר ב"] = semInfo[1];
    semesterInformation["שנתי"] = semInfo[2];

    exclusionDates = packedStuff.exclusionDates;
    dateDict = packedStuff.dateDict;
    return exportCal();
}


function exportCal() {
    if (!document.documentURI.startsWith("https://www.digmi.org/huji/") &&!document.documentURI.startsWith("http://www.digmi.org/huji/")&&!document.documentURI.startsWith("http://digmi.org/huji/") &&!document.documentURI.startsWith("https://digmi.org/huji/")) {
        alert('Please Use Addon on https://www.digmi.org/huji/ .');
        return;
    }
    id = 0;
    cookies_cour = JSON.parse($.cookie(id + '_courses'));
    var calendar;
    calendar = "BEGIN:VCALENDAR\n";
    calendar += "VERSION:2.0\n";
    var i = 0;
    var j = 0;
    for (c in cookies_cour) {
        $.ajax({
            type: 'GET',
            url: 'https://www.digmi.org/huji/get_course.php?year=' + year + '&course=' + c,
            success: function (data) {
                calendar += extractData(data);
                i++;
                if (i == j) {
                    // window.open("data:text/calendar;charset=utf-8," + escape(calendar));
                    // download_file("Calendar.ics", calendar + "END:VCALENDAR");
                    chrome.runtime.sendMessage({contentScriptQuery: 'gotCalendarInfo',
                        parsedCalendar: {
                            'ics': calendar + "END:VCALENDAR",
                            'eventList': eventsForGoogle,
                            'courses': cookies_cour
                        }
                    });
                    return;
                    // return {'ics':calendar + "END:VCALENDAR", 'eventList':eventsForGoogle};
                }
            }
        });
        j++;
    }

}


function extractData(courseData) {
    var courseId = courseData.id;
    var courseName = courseData.name;
    var courseLect = cookies_cour[courseId]["שעור"];
    var courseTA = cookies_cour[courseId]["תרג"];

    let iCalEvent;
    iCalEvent = "";
    let place;
    let start;
    let end;
    let title;
    for (lesson in cookies_cour[courseId]) {
        for (hour in courseData.lessons[cookies_cour[courseId][lesson]].hours) {
            try {


                var currentEvent = {

                    'end': {
                        'dateTime': "",
                        "timeZone": "Asia/Jerusalem"
                    },
                    'start': {
                        'dateTime': "",
                        "timeZone": "Asia/Jerusalem"
                    },
                    'location': "",
                    'summary': '',
                    'recurrence': []

                };

                hours = courseData.lessons[cookies_cour[courseId][lesson]].hours;
                lessonType = lesson;
                if (lessonTypeDict.hasOwnProperty(lesson)) {
                    lessonType = lessonTypeDict[lesson];
                }

                lessonSemester = hours[hour].semester;
                coursesAndSemesters[courseId] = { semester: lessonSemester, name: courseName};

                //date = translateDayToDate(hours[hour].day, hours[hour].semester);
                date = dateDict[lessonSemester][hours[hour].day];

                timeInDay = hours[hour].hour.split('-');


                aTime = timeInDay[0];
                bTime = timeInDay[1];


                aTime = aTime.replace(':', '');
                bTime = bTime.replace(':', '');


                // In some cases, the times are in the wrong order, so we should check the order.
                aTimeInt = parseInt(aTime);
                bTimeInt = parseInt(bTime);
                if (aTimeInt < bTimeInt) {
                    startTime = aTime;
                    endTime = bTime;
                } else {
                    startTime = bTime;
                    endTime = aTime;
                }

                place = hours[hour].place;
                start = date + "T" + startTime + '00';
                end = date + "T" + endTime + '00';
                title = lessonType + ": " + courseId + " -- " + courseName;
                currentEvent.summary = title;
                currentEvent.location = place;

                startTimeForGoogle = startTime.substr(0, 2) + ':' + startTime.substr(2, 2) + ':00';
                endTimeForGoogle = endTime.substr(0, 2) + ':' + endTime.substr(2, 2) + ':00';
                dateForGoogle = date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);

                startDateForGoogle = dateForGoogle + 'T' + startTimeForGoogle;
                endDateForGoogle = dateForGoogle + 'T' + endTimeForGoogle;

                currentEvent.start.dateTime = startDateForGoogle;
                currentEvent.end.dateTime = endDateForGoogle;

                iCalEvent += createIcalEvent(title, start, end, place, semesterInformation[lessonSemester].end, currentEvent);
            } catch (e) {
                console.error("Could not create event for course " + courseId + ", reason:\n" + e.message);
            }
        }
    }
    // for (hour in courseData.lessons[courseTA].hours) {
    //     hours = courseData.lessons[courseTA].hours;
    //     date = translateDayToDate(hours[hour].day, hours[hour].semester);
    //     timeInDay = hours[hour].hour.split('-');
    //     startTime = timeInDay[0];
    //     endTime = timeInDay[1];
    //     place = hours[hour].place;
    //     start = date + "T" + startTime.replace(':', '') + '00';
    //     end = date + "T" + endTime.replace(':', '') + '00';
    //     title = "תרגול: " + courseId + " -- " + courseName;
    //     iCalEvent += createIcalEvent(title, start, end, place, endOfSemester[hours[hour].semester]);
    // }
    return iCalEvent;
}


function translateDayToDate(day, semester) {
    return dateDict[semester][day];

}

function createIcalEvent(title, start, end, place, endOfSemester, currentEvent) {
    // decode html entities in "place" string
    // place = $('<div>').html(place).text();

    startTime = start.substr(9, start.length - 1);
    var exdate = '';
    var result = "BEGIN:VEVENT\n";
    result += "DTSTART;TZID=Asia/Jerusalem:" + start + "Z\n";
    result += "DTEND;TZID=Asia/Jerusalem:" + end + "Z\n";
    result += "RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=" + endOfSemester + "T235959Z\n";
    currentEvent.recurrence.push("RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=" + endOfSemester + "T235959Z\n");
    exdate += "EXDATE;TZID=Asia/Jerusalem:";
    for (i = 0; i < exclusionDates.length - 1; i++) {
        exdate += exclusionDates[i] + 'T' + startTime + ',';
    }
    exdate += exclusionDates[i] + 'T' + startTime + '\n';
    currentEvent.recurrence.push(exdate);
    result += exdate;
    result += "SUMMARY:" + title + "\n";
    result += "LOCATION:" + place + "\n";
    result += "END:VEVENT\n";
    eventsForGoogle.push(currentEvent);
    currentEventIndex++;
    return result;
}
function makeTwoDigits(number) {
    number = number.toString().trim();
    if (number.length < 2) {
        return '0' + number;
    }
    return number;
}

