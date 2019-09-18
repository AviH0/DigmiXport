var API_KEY = 'AIzaSyD6JAUasHzAVvv_f7bOtYeGPPcZO7sn6F0';


function getCalendarList(callback, token){
    let init = {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        'contentType': 'json'
    };
    fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?&key=' + API_KEY,
        init)
        .then((response) => response.json())
        .then(data=>callback(data, token));
}

function createForm(){
    var calendarList = document.createElement("SELECT");
    calendarList.id='calendar_list';
    calendarList.style.display='none';
    var selectLabel = document.createElement('label');
    selectLabel.innerText = 'Select target calendar, or create new calendar';
    selectLabel.htmlFor='calendar_list';
    selectLabel.id='select_label';
    selectLabel.style.display='none';
    var selectButton = document.createElement('button');
    selectButton.innerText = 'Select';
    selectButton.id= 'select';
    selectButton.style.display='none';

    var editText = document.createElement("INPUT");
    editText.setAttribute("type", "text");
    editText.placeholder = "Enter Calendar Name";
    editText.id='new_calendar_name';
    editText.style.display='none';
    var newCalLabel = document.createElement('label');
    newCalLabel.innerText = 'Enter name for new calendar';
    newCalLabel.htmlFor='new_calendar_name';
    newCalLabel.id='new_cal_label';
    newCalLabel.style.display='none';
    var newCalendarButton = document.createElement('button');
    newCalendarButton.id='create';
    newCalendarButton.innerText = "Create";
    newCalendarButton.style.display='none';

    var exportButton = document.createElement('button');
    exportButton.id='export';
    exportButton.style.display='none';

    body = document.getElementsByTagName('body')[0];

    body.appendChild(selectLabel);
    body.appendChild(calendarList);
    body.appendChild(selectButton);
    body.appendChild(newCalLabel);
    body.appendChild(editText);
    body.appendChild(newCalendarButton);
    body.appendChild(exportButton);



}

function populateDropList(data, token){
    calendarList = document.getElementById('calendar_list');
    for(option in calendarList.options){
        calendarList.remove(calendarList.options[option]);
    }
    for(cal in data.items){
        var calName = document.createElement("option");
        calName.text = data.items[cal].summary;
        calName.id = cal;
        calendarList.add(calName,cal);
    }
    var calName = document.createElement("option");
    calName.text = "Create New Calendar...";
    calendarList.add(calName, cal+1);
    calendarList.style.display='inline-block';
    let selectLabel = document.getElementById('select_label');
    selectLabel.style.display='inline';


    selectButton = document.getElementById('select');
    selectButton.style.display='inline';
    selectButton.onclick = function () {
        selectedCalendarInedx = calendarList.selectedIndex;
        currentCal = data.items[calendarList.options[selectedCalendarInedx].id];

        if(calendarList.options[selectedCalendarInedx].text == 'Create New Calendar...') {
            createNewCalendar(token);
            return;
        }
        exportButton = document.getElementById('export');
        exportButton.innerText = 'Publish calendar to \"' + currentCal.summary + "\"";
        exportButton.onclick = ()=> exportEvents(currentCal.id, token);
        exportButton.style.display='inline';
    };
}

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    createForm();
    chrome.identity.getAuthToken({interactive: true}, function (token) {
        getCalendarList(populateDropList, token);
    });



}




function createNewCalendar(token) {
    var newCalendar = "";
    var editText = document.getElementById('new_calendar_name');
    var newCalendarButton = document.getElementById('create');
    var newCalLabel = document.getElementById('new_cal_label');


    newCalendarButton.onclick = function () {

        newCalendarName = editText.value;
        if(newCalendarName == "") {
            alert("Please type a name for the new calendar!");
            return;
        }

        let newCalendarRequest = {
            method: 'POST',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"summary": newCalendarName})
        };
        fetch(
            'https://www.googleapis.com/calendar/v3/calendars', newCalendarRequest)
            .then((response) =>{
                editText.style.display='none';
                newCalendarButton.style.display='none';
                newCalLabel.style.display='none';
                alert("calendar created!");
                getCalendarList(populateDropList, token)
            });
        newCalendarButton.disabled=true;
        newCalendarButton.innerText='Please wait...';
    };
    newCalLabel.style.display='inline-block';
    editText.style.display='inline';
    newCalendarButton.style.display='inline';

}

function exportEvents(calId, token){
    eventList = parsedCalendar['eventList'];
    errorFlag = 0;
    for(eventIndex in eventList){
        let newEvent = {
            method: 'POST',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventList[eventIndex])
        };
        fetch(
            'https://www.googleapis.com/calendar/v3/calendars/'+calId +'/events',
            newEvent).then((response) => response.json())
            .then((data)=>{
                if(data.hasOwnProperty('error')) {
                    errorFlag = 1;
                }
    });
    }
    if(errorFlag){
        alert("There were some errors while exporting");
    }
    else {
        alert("Export successful!");
    }
}