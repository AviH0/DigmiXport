# DigmiXport
A Web Extension that allows exporting an ICal calendar from HUJI Digmi.

## Installation (Firefox):
Simply grab the xpi file from the latest release and open it with mozilla firefox. Allow github to install the add-on if needed and proceed with the installation as prompted. The add-on is signed by mozilla and will auto-update as needed. After the installation is complete a button should appear in the browser toolbar with the clock icon on it.

Note: Due to [this](https://bugzilla.mozilla.org/show_bug.cgi?id=1292701) issue with firefox, The popup has been relocated to a tab.

## Installation (Chrome):
Go to:
[DigmiXport on Chrome Web Store](https://chrome.google.com/webstore/detail/hujidigmixport/egggfnhegcafmnaklhgfbhdlecphmadk) 
and click 'Add to Chrome'.

## Exporting from Digmi
Note: since v1.4.0 integrated export to google calendar is available.
1) Go to https://www.digmi.org/huji/
2) Build your timetable as usual.
3) Click DigmiXport's toolbar button and the 'Export Digmi Calendar' Button that will appear.
4) A save dialog will appear for a file called calendar.ics. Save the file and do with it as you wish.

## Importing ics into Google Calendar
1) Go to https://calendar.google.com/calendar/r/settings/createcalendar .
2) Optional: Create a new calendar for the exported events and give it a name. This is not mandatory but is recommended as any resulting mess can be removed easily by deleting the calendar.
3) Go to https://calendar.google.com/calendar/r/settings/export . Note that we are interested in the import section, and not the export section.
4) Click select file and upload the ics file you exported from Digmi.
5) In the 'add to calendar' option, select the calendar you created in step 2. If you skipped step 2, chooses any calendar you wish.
6) Click import, and you are done. Adjust settings on relevant devices to be sure the new calendar is displayed.

## Diclaimer
I do not know the author of Digmi, and did not consult with him regarding this extension. The current icon is the same image that appears on https://www.digmi.org/huji/ and I will replace it if requested.
