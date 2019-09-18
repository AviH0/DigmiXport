var year = 2020;
var year_prefix = '20'; // Change if next century.
var exclusionDates = [];
var eventsForGoogle = [];
var currentEventIndex = 0;


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
var lessonTypeDict = {
    "תרג": "תרגול",
    "שעור": "הרצאה",
    "שות": "שות",
    "סדנה": "סדנה",
    "מעב": "מעבדה"
};
browser.runtime.sendMessage(
    {contentScriptQuery: 'getCalendarInfo'}, response => tableRecieved(response));


function tableRecieved(packedStuff) {

    semInfo = [];
    for(inf in packedStuff.semesterInformation){
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
    if (!document.documentURI.startsWith("https://www.digmi.org/huji/")) {
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
                    browser.runtime.sendMessage({contentScriptQuery: 'gotCalendarInfo', parsedCalendar: {'ics':calendar + "END:VCALENDAR", 'eventList':eventsForGoogle}});
                    return;
                    // return {'ics':calendar + "END:VCALENDAR", 'eventList':eventsForGoogle};
                }
            }
        });
        j++;
    }

}

// function getId() {
//
//     cookies_cour = JSON.parse($.cookie(id + '_courses'));
// }

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

                    'end':{
                        'dateTime' :"",
                        "timeZone": "Asia/Jerusalem"
                    },
                    'start':{
                        'dateTime':"",
                        "timeZone": "Asia/Jerusalem"
                    },
                    'location': "",
                    'summary':'',
                    'recurrence': []

                };

                hours = courseData.lessons[cookies_cour[courseId][lesson]].hours;
                lessonType = lesson;
                if (lessonTypeDict.hasOwnProperty(lesson)) {
                    lessonType = lessonTypeDict[lesson];
                }

                lessonSemester = hours[hour].semester;

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

                startTimeForGoogle = startTime.substr(0,2) + ':'  +startTime.substr(2,2) + ':00';
                endTimeForGoogle = endTime.substr(0,2) +':' +endTime.substr(2,2) + ':00';
                dateForGoogle = date.substr(0,4) + '-' + date.substr(4,2) + '-' +date.substr(6,2);

                startDateForGoogle = dateForGoogle + 'T' +startTimeForGoogle;
                endDateForGoogle = dateForGoogle + 'T' +endTimeForGoogle;

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


