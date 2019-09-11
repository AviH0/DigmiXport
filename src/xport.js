var year = 2020;
var year_prefix = '20'; // Change if next century.
var exclusionDates = [];

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
        "יום ו'": "20191101"
    },
    "סמסטר ב": {
        "יום א'": "20200315",
        "יום ב'": "20200316",
        "יום ג'": "20200317",
        "יום ד'": "20200318",
        "יום ה'": "20200319",
        "יום ו'": "20200320"
    }
};
var semesterInformation = {
    "סמסטר א": {
        "start": "",
        "end" : "20200128"
    },
    "סמסטר ב": {
        "start": "",
        "end" : "20200730"
    },
    "שנתי": {
        "start": "",
        "end" : "20200128"
    }
};
var endOfSemester = {"סמסטר ב": "20200730", "סמסטר א": "20200128","שנתי": "20200128"};

xhr = new XMLHttpRequest();
xhr.open('GET', "https://academic-secretary.huji.ac.il/%D7%9C%D7%95%D7%97-%D7%94%D7%A9%D7%A0%D7%94-%D7%94%D7%90%D7%A7%D7%93%D7%9E%D7%99%D7%AA");
xhr.addEventListener('loadend', tableLoaded);
xhr.addEventListener("error", tableLoaded);
xhr.send();

function tableLoaded(e) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xhr.responseText, "text/html");
    hujiTable = doc;
    table = hujiTable.getElementsByTagName('table')[0];
    tableRows = table.getElementsByTagName('tr');

    for(row=0;row< tableRows.length;row++){

        eventName = tableRows[row].cells[0].textContent;
        if(eventName.includes("פתיחת שנת הלימודים")){
            semesterAbeginsAt = tableRows[row].cells[2].textContent;
            semesterAbeginsAtDates = semesterAbeginsAt.split('.');

            semesterAbeginsAtDates[0] =makeTwoDigits(semesterAbeginsAtDates[0]);
            semesterAbeginsAtDates[1] =makeTwoDigits(semesterAbeginsAtDates[1]);
            semesterAbeginsAtDates[2] =makeTwoDigits(semesterAbeginsAtDates[2]);


            semesterAbeginsAt = year_prefix + semesterAbeginsAtDates[2]+ semesterAbeginsAtDates[1] + semesterAbeginsAtDates[0];
            semesterAbeginsAt=semesterAbeginsAt.trim();
        }
        if(eventName.includes("סיום סמסטר א'")){
            semesterAendsAt = tableRows[row].cells[2].textContent;
            semesterAendsAtDates = semesterAendsAt.split('.');

            semesterAendsAtDates[0] =makeTwoDigits(semesterAendsAtDates[0]);
            semesterAendsAtDates[1] =makeTwoDigits(semesterAendsAtDates[1]);
            semesterAendsAtDates[2] =makeTwoDigits(semesterAendsAtDates[2]);


            semesterAendsAt = year_prefix + semesterAendsAtDates[2] + semesterAendsAtDates[1] + semesterAendsAtDates[0];
            semesterAendsAt=semesterAendsAt.trim();
        }
        if(eventName.includes("פתיחת סמסטר ב'")){
            semesterBbeginsAt = tableRows[row].cells[2].textContent;
            semesterBbeginsAtDates = semesterBbeginsAt.split('.');

            semesterBbeginsAtDates[0] =makeTwoDigits(semesterBbeginsAtDates[0]);
            semesterBbeginsAtDates[1] =makeTwoDigits(semesterBbeginsAtDates[1]);
            semesterBbeginsAtDates[2] =makeTwoDigits(semesterBbeginsAtDates[2]);

            semesterBbeginsAt =year_prefix + semesterBbeginsAtDates[2] + semesterBbeginsAtDates[1] +  semesterBbeginsAtDates[0];
            semesterBbeginsAt=semesterBbeginsAt.trim();
        }
        if(eventName.includes("סיום סמסטר ב'")){
            semesterBendsAt = tableRows[row].cells[2].textContent;
            semesterBendsAtDates = semesterBendsAt.split('.');

            semesterBendsAtDates[0] =makeTwoDigits(semesterBendsAtDates[0]);
            semesterBendsAtDates[1] =makeTwoDigits(semesterBendsAtDates[1]);
            semesterBendsAtDates[2] =makeTwoDigits(semesterBendsAtDates[2]);

            semesterBendsAt = year_prefix + semesterBendsAtDates[2] + semesterBendsAtDates[1] + semesterBendsAtDates[0];
            semesterBendsAt=semesterBendsAt.trim();
        }
        if(tableRows[row].cells[3].textContent.includes("לא יתקיימו לימודים או בחינות")) {
            exclusionDate = tableRows[row].cells[2].textContent;

            // Parse which dates are to be excluded. this is fun.
            exclusionDate = exclusionDate.trim();
            dateRange = exclusionDate.split('-');
            if (dateRange.length > 1) {
                if (dateRange[0].split('.').length == 1) {
                    endRange = dateRange[1].split('.');
                    for (i = parseInt(dateRange[0]); i <= parseInt(endRange[0]); i++) {
                        ii =  i.toString();

                        ii = makeTwoDigits(ii);
                        endRange[1] = makeTwoDigits(endRange[1]);

                        exclusionDate =  year_prefix + endRange[2] + endRange[1] +ii;
                        exclusionDates.push(exclusionDate);
                    }
                } else {
                    startRange = dateRange[0].split('.');
                    endRange = dateRange[1].split('.');
                    if (parseInt(startRange[0]) < parseInt(startRange[1])) {
                        for (i = parseInt(startRange[0]); i < 32; i++) {
                            ii =  i.toString();

                            ii = makeTwoDigits(ii);
                            startRange[1] = makeTwoDigits(startRange[1]);

                            exclusionDate =  year_prefix + startRange[2] + startRange[1] +ii;
                            exclusionDates.push(exclusionDate);
                        }
                        for (i = 1; i <= parseInt(endRange[0]); i++) {
                            ii =  i.toString();

                            ii = makeTwoDigits(ii);
                            endRange[1] = makeTwoDigits(endRange[1]);

                            exclusionDate = year_prefix + endRange[2]+ endRange[1] + ii;
                            exclusionDates.push(exclusionDate);
                        }
                    }
                    else{
                        for (i = parseInt(startRange[0]); i < parseInt(endRange[0]); i++) {
                            ii =  i.toString();

                            ii = makeTwoDigits(ii);
                            startRange[1] = makeTwoDigits(startRange[1]);

                            exclusionDate =  year_prefix + startRange[2] + startRange[1] +ii;
                            exclusionDates.push(exclusionDate);
                        }
                    }
                }
            } else {
                exclusionDateDates = exclusionDate.split('.');
                exclusionDateDates[0] = makeTwoDigits(exclusionDateDates[0]);
                exclusionDateDates[1] = makeTwoDigits(exclusionDateDates[1]);

                exclusionDate =year_prefix + exclusionDateDates[2] + exclusionDateDates[1] +  exclusionDateDates[0];
                exclusionDate = exclusionDate.trim();
                exclusionDates.push(exclusionDate);
            }
        }
    }

    endOfSemester["סמסטר א"] = semesterAendsAt;
    endOfSemester["סמסטר ב"] = semesterBendsAt;
    endOfSemester["שנתי"] = semesterBendsAt;
    semesterInformation = {
        "סמסטר א": {
            start: semesterAbeginsAt,
            end : semesterAendsAt
        },
        "סמסטר ב": {
            start: semesterBbeginsAt,
            end : semesterBendsAt
        },
        "שנתי": {
            start: semesterAbeginsAt,
            end : semesterBendsAt
        }
    };
    exportCal();
}

function makeTwoDigits(number){
    number = number.trim();
    if(number.length<2){
        return '0' + number;
    }
    return number;
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
                    download_file("Calendar.ics", calendar+"END:VCALENDAR");
                }
            }
        });
        j++;
    }

}

function getId() {

    cookies_cour = JSON.parse($.cookie(id + '_courses'));
}

function extractData(courseData) {
    var courseId = courseData.id;
    var courseName = courseData.name;
    var courseLect = cookies_cour[courseId]["שעור"];
    var courseTA = cookies_cour[courseId]["תרג"];

    iCalEvent = "";
    for (lesson in cookies_cour[courseId]) {
        for (hour in courseData.lessons[cookies_cour[courseId][lesson]].hours) {
            try {
                hours = courseData.lessons[cookies_cour[courseId][lesson]].hours;
                lessonType = lesson;
                if (lessonTypeDict.hasOwnProperty(lesson)) {
                    lessonType = lessonTypeDict[lesson];
                }

                lessonSemester = hours[hour].semester;

                //date = translateDayToDate(hours[hour].day, hours[hour].semester);
                date = semesterInformation[lessonSemester].start;

                timeInDay = hours[hour].hour.split('-');


                aTime = timeInDay[0];
                bTime = timeInDay[1];

                aTime = aTime.replace(':', '');
                bTime = bTime.replace(':', '');


                // In some cases, the times are in the wrong order, so we should check the order.
                aTimeInt = parseInt(aTime);
                bTimeInt = parseInt(bTime);
                if(aTimeInt<bTimeInt){
                    startTime = aTime;
                    endTime = bTime;
                }
                else {
                    startTime = bTime;
                    endTime = aTime;
                }

                place = hours[hour].place;
                start = date + "T" + startTime + '00';
                end = date + "T" + endTime + '00';
                title = lessonType + ": " + courseId + " -- " + courseName;
                iCalEvent += createIcalEvent(title, start, end, place, semesterInformation[lessonSemester].end,hours[hour].day);
            }
            catch (e) {
                console.error("Could not create event for course "+ courseId + ", reason:\n" + e.message);
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


var lessonTypeDict = {
    "תרג": "תרגול",
    "שעור": "הרצאה",
    "שות": "שות",
    "סדנה": "סדנה",
    "מעב": "מעבדה"
};



function translateDayToDate(day, semester) {
    return dateDict[semester][day];

}

function createIcalEvent(title, start, end, place, endOfSemester, byDay) {
    // decode html entities in "place" string
    // place = $('<div>').html(place).text();

    startTime = start.substr(9, start.length-1);

    var result = "BEGIN:VEVENT\n";
    result += "DTSTART:" + start + "\n";
    result += "DTEND:" + end + "\n";
    byDay = dateDict["סמסטר א"][byDay];
    result += "RRULE:FREQ=WEEKLY;BYDAY="+byDay+";INTERVAL=1;" + "UNTIL=" + endOfSemester + "T000000\n";
    result += "EXDATE:";
    for(i=0;i<exclusionDates.length-1;i++){
        result+= exclusionDates[i] + 'T'+ startTime + ',';
    }
    result+=exclusionDates[i]+ '\n';
    result += "SUMMARY:" + title + "\n";
    result += "LOCATION:" + place + "\n";
    result += "END:VEVENT\n";
    return result;
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
