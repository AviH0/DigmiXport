var year = 2020;

(function () {
    if(document.documentURI != "https://www.digmi.org/huji/"){
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
                    download_file("Calendar.ics", calendar);
                }
            }
        });
        j++;
    }

})();


function extractData(courseData) {
    var courseId = courseData.id;
    var courseName = courseData.name;
    var courseLect = cookies_cour[courseId]["שעור"];
    var courseTA = cookies_cour[courseId]["תרג"];
    iCalEvent = "";
    for (hour in courseData.lessons[courseLect].hours) {
        hours = courseData.lessons[courseLect].hours;
        date = translateDayToDate(hours[hour].day, hours[hour].semester);
        timeInDay = hours[hour].hour.split('-');
        startTime = timeInDay[0];
        endTime = timeInDay[1];
        place = hours[hour].place;
        start = date + "T" + startTime.replace(':', '') + '00';
        end = date + "T" + endTime.replace(':', '') + '00';
        title = "הרצאה: " + courseId + " -- " + courseName;
        iCalEvent += createIcalEvent(title, start, end, place, endOfSemester[hours[hour].semester]);
    }
    for (hour in courseData.lessons[courseTA].hours) {
        hours = courseData.lessons[courseTA].hours;
        date = translateDayToDate(hours[hour].day, hours[hour].semester);
        timeInDay = hours[hour].hour.split('-');
        startTime = timeInDay[0];
        endTime = timeInDay[1];
        place = hours[hour].place;
        start = date + "T" + startTime.replace(':', '') + '00';
        end = date + "T" + endTime.replace(':', '') + '00';
        title = "תרגול: " + courseId + " -- " + courseName;
        iCalEvent += createIcalEvent(title, start, end, place, endOfSemester[hours[hour].semester]);
    }
    return iCalEvent;
}

var dateDict = {
    "סמסטר א": {
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
var endOfSemester = {"סמסטר ב": "20200730", "סמסטר א": "20200128"};

function translateDayToDate(day, semester) {
    return dateDict[semester][day];

}

function createIcalEvent(title, start, end, place, endOfSemester) {
    // decode html entities in "place" string
    // place = $('<div>').html(place).text();
    var result = "BEGIN:VEVENT\n";
    result += "DTSTART:" + start + "\n";
    result += "DTEND:" + end + "\n";
    result += "RRULE:FREQ=WEEKLY;UNTIL=" + endOfSemester + "T000000\n";
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
