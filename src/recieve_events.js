const LESSON_EVENTS_READY = 'gotCalendarInfo';

let parsedCalendar = {};

function setup_lessons_ready_listener()
{
    chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if(request.contentScriptQuery === LESSON_EVENTS_READY){
            parsedCalendar = request.parsedCalendar;
            ui_on_lessons_ready()
        }
    });

}