var CALENDAR_INFO_REQUEST = 'getCalendarInfo';
var LESSON_EVENTS_READY = 'gotCalendarInfo';



// let year = 2022; // NEED TO CHANGE THIS FOR NEXT YEAR
var year = ""
var year_prefix = '20'; // Change if next century.
var exclusionDates = [];
var eventsForGoogle = [];
var iCalString = "";
var currentEventIndex = 0;
var coursesAndSemesters = {};


var dateDict = {};

var semesterInformation = {};

// var courseSemesterToExamSemester = {
//     "סמסטר א": "סמסטר א",
//     "סמסטר ב": "סמסטר ב",
//     "שנתי": "סמסטר ב"
//
// }


var lessonTypeDict = {
    "תרג": "תרגול",
    "שעור": "הרצאה",
    "שות": "שות",
    "סדנה": "סדנה",
    "מעב": "מעבדה"
};

function recieve_academic_cal(calendar_info) {
    semInfo = [];
    for (inf in calendar_info.semesterInformation) {
        semInfo.push(calendar_info.semesterInformation[inf]);
    }
    semesterInformation["סמסטר א"] = semInfo[0];
    semesterInformation["סמסטר ב"] = semInfo[1];
    semesterInformation["שנתי"] = semInfo[2];

    exclusionDates = calendar_info.exclusionDates;
    dateDict = calendar_info.dateDict;
    return exportCal();
}

function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', " + currVariable + ");\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $("body").attr("tmp_" + currVariable);
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}
year = retrieveWindowVariables(['year']).year;
chrome.runtime.sendMessage(
    {contentScriptQuery: CALENDAR_INFO_REQUEST, year:year}, response => recieve_academic_cal(response));

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
                    if (exams[course][exam].hasOwnProperty("null")) {
                        continue;
                    }
                    var wantedSemester = coursesAndSemesters[course].semester;
                    var course_name = coursesAndSemesters[course].name;
                    if (exams[course][exam].semester != wantedSemester) {
                        continue;
                    }
                    if (!courseExams.hasOwnProperty(exams[course][exam].moed)) {
                        eDate = exams[course][exam].date;
                        eYear = eDate.substring(6, 10);
                        eMonth = eDate.substring(3, 5);
                        eDay = eDate.substring(0, 2);
                        eDate = eYear + '-' + eMonth + '-' + eDay;
                        if (exams[course][exam].time.match(/\d\d:\d\d/) == null) {
                            all_exam_times_set = false;
                            exams[course][exam].time = "00:00";
                            exams[course][exam].moed += " - טרם נקבעה שעה"
                        }
                        dateTimeStart = eDate + 'T' + exams[course][exam].time + ':00';
                        dateVar = new Date(dateTimeStart);
                        THREEHOURS = 10800000;
                        ONEHOUR = THREEHOURS / 3;
                        length_of_exam = exams[course][exam].length * ONEHOUR;
                        endDateVar = new Date(dateVar.getTime() + length_of_exam);
                        dateTimeEnd = endDateVar.getFullYear() + '-' + makeTwoDigits(endDateVar.getMonth() + 1) + '-' + makeTwoDigits(endDateVar.getDate()) + 'T' + makeTwoDigits(endDateVar.getHours()) + ':' + makeTwoDigits(endDateVar.getMinutes()) + ':00';
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
            if (!all_exam_times_set) {
                parsedCalendarFromReq['message'] = "Please note: some exams' hours have not yet been set.";
            }
            sendResponse(parsedCalendarFromReq);
        }
        // return true;  // Will respond asynchronously.
    });

function notify_leeson_events_ready() {
    chrome.runtime.sendMessage({
        contentScriptQuery: LESSON_EVENTS_READY,
        parsedCalendar: {
            'ics': iCalString + "END:VCALENDAR",
            'eventList': eventsForGoogle,
            'courses': cookies_cour
        }
    });

}

function exportCal() {
    if (!document.documentURI.startsWith("https://www.digmi.org/huji/") && !document.documentURI.startsWith("http://www.digmi.org/huji/") && !document.documentURI.startsWith("http://digmi.org/huji/") && !document.documentURI.startsWith("https://digmi.org/huji/")) {
        alert('Please Use Addon on https://www.digmi.org/huji/ .');
        return;
    }
    id = 0;
    cookies_cour = JSON.parse($.cookie(id + '_courses'));

    iCalString = "BEGIN:VCALENDAR\n";
    iCalString += "VERSION:2.0\n";
    url_prefix = document.documentURI.match(/http[s]?:\/\/[w]*\.?/);
    let i = 0;
    let num_courses = 0;
    for (c in cookies_cour) { num_courses++;}
    for (c in cookies_cour) {
        $.ajax({
            type: 'GET',
            url: url_prefix + 'digmi.org/huji/get_course.php?year=' + year + '&course=' + c,
            success: function (data) {
                extract_course_events(data);
                i++;
                if (i === num_courses) {
                    notify_leeson_events_ready()
                }
            }
        });

    }

}


function extract_course_events(courseData) {
    let courseId = courseData.id;
    let courseName = courseData.name;
    let courseLect = cookies_cour[courseId]["שעור"];
    let courseTA = cookies_cour[courseId]["תרג"];

    let iCalEvent;
    iCalEvent = "";
    let place;
    let start;
    let end;
    let title;
    for (lesson in cookies_cour[courseId]) {
        if (cookies_cour[courseId][lesson] >= courseData.lessons.length) {
            console.log("Some info was missing for course with ID " + courseId + ". Please verify this.")
            continue;
        }
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
                coursesAndSemesters[courseId] = {semester: lessonSemester, name: courseName};

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

                iCalEvent += createEvent(title, start, end, place, semesterInformation[lessonSemester].end, currentEvent);
            } catch (e) {
                console.error("Could not create event for course " + courseId + ", reason:\n" + e.message);
            }
        }
    }

    iCalString += iCalEvent;
}


// function translateDayToDate(day, semester) {
//     return dateDict[semester][day];
//
// }

function createEvent(title, start, end, place, endOfSemester, currentEvent) {
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

