frappe.pages['my-calendar'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'My Calendar',
        single_column: true
    });
         // Apply CSS to ensure the title is shown in one line and not truncated
    $('<style/>', {
        type: 'text/css',
        html: `
            .page-title .title-area .title-text {
                font-size: var(--text-2xl);
                font-weight: none !important;
                letter-spacing: 0.01em;
                cursor: pointer;
                margin-bottom: 0px;
                margin-right: var(--margin-sm);
                max-width: none !important;  /* Remove any max-width restriction */
                white-space: nowrap !important;  /* Force the text to stay on one line */
                overflow: visible !important;   /* Prevent text overflow */
                text-overflow: clip !important;  /* Ensure no ellipsis (...) */
            }
            .calendar-title-bold {
                font-weight: bold;
            }

            .calendar-title-normal {
                font-weight: normal;
            }
              /* Mobile-specific styles */
        @media (max-width: 768px) {
            /* Adjust for mobile view */
            .calendar-title-bold {
               
                font-weight: bold;
            }

            .calendar-title-normal {
                
                font-weight: normal;
            }

            .page-title .title-area .title-text {
                font-size: 14px; /* Reduce the main title font size on mobile */
                white-space: nowrap !important; /* Allow the title text to wrap */
                overflow: visible !important; /* Prevent text overflow */
                text-overflow: clip !important; /* Ensure no ellipsis */
            }
        }
            
        `
    }).appendTo('head');

    // Load FullCalendar CSS
    $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/fullcalendar@5.1.0/main.min.css'
    }).appendTo('head');

    // Add custom CSS for mobile view adjustments
       // Add custom CSS for mobile view adjustments
       var customStyles = `
        .friday-highlight {
        background-color: #F8F8F8 !important;
        }
        
       @media (max-width: 768px) {
           .friday-highlight {
             background-color: #F8F8F8 !important;
            }
            
           .fc-toolbar {
               font-size: 9px;
           }
           .fc-toolbar .fc-left,
           .fc-toolbar .fc-right {
               display: none;
           }
           .fc-toolbar .fc-center {
               text-align: center;
               width: 100%;
           }
           .fc .fc-dayGridMonth-view .fc-day-top {
               height: auto !important;
           }
           .fc .fc-dayGridMonth-view .fc-day-top .fc-day-number {
               font-size: 12px;
           }
           .fc .fc-event {
               font-size: 10.5px;
               padding: 1px;
           }
           .fc .fc-scroller {
               height: auto !important;
               overflow: hidden !important;
           }
           #event-details-card {
               display: none;
               padding: 10px;
               
               border-radius: 5px;
               
               margin-top: 10px;
               box-shadow: 1px 3px 10px gray;
           }
           .fc-event:hover {
               font-size: 11px;
               color: white !important;
               border:  solid #2c3e50 !important;
               transform: translateY(-3px);
               box-shadow: 1px 3px 5px gray;
           }
       }


       @media (min-width: 769px) {
            .fc-event-title::first-letter {
                visibility: hidden;  /* Hide the first character */
            }
            .friday-highlight {
             background-color: #F8F8F8 !important;
            }
           #event-details-card {
               display: none !important;
           }
           /* Underline the event title when hovered */
        .fc-event:hover {
            font-size: 13px;
               color: white !important;
               font-weight: 500;
               transform: translateY(-3px);
              
               text-decoration: underline;
        }   


       }
   `;
    $('<style/>', {
        type: 'text/css',
        html: customStyles
    }).appendTo('head');
    //To fetch data according to filter
    frappe.call({  
        method: "hr_plus.hr_plus.page.my_calendar.my_calendar.is_hr_manager",
        callback: function(r) {
            var is_hr_manager = r.message;

            // Load FullCalendar JS and initialize the calendar
            $.getScript('https://cdn.jsdelivr.net/npm/fullcalendar@5.1.0/main.min.js', function() {
                $(page.body).append('<div id="calendar"></div>');
                var calendarEl = document.getElementById('calendar');
                $(page.body).append('<div id="event-details-card" class="event-details-card"></div>');
                
                var headerToolbar = {
                    left: 'prev,next',
                    center: 'title',
                    right: 'today'
                };

                if (is_hr_manager) {
                    headerToolbar.right = 'filterButton,today';
                }
                //This calendar is desktop view only
                var calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    headerToolbar: headerToolbar,
                    height: 'auto', // Set the height to auto to fit the content
                    fixedWeekCount: false, // This ensures only the exact number of weeks in the month are shown
                    customButtons: {
                        filterButton: {
                            text: 'Filter',
                            click: function() {
                                // Display a dialog box with filter options
                                frappe.prompt([
                                    {'fieldname': 'employee', 'fieldtype': 'Link', 'label': 'Employee', 'options': 'Employee', 'default': '', 'reqd': 0}
                                ],
                                function(values) {
                                    var employeeFilter = values.employee;

                                    // Fetch the employee name or ID to update the title
                                    frappe.db.get_value('Employee', employeeFilter, ['employee_name', 'name'], function(r) {
                                        var employeeNameOrID = r.employee_name || r.name;

                                        // Dynamically update the page title with the selected employee
                                        // Set the page title with a placeholder
                                        page.set_title(`My Calendar - <span class="calendar-title-normal">${employeeNameOrID}</span>`);

                                        // After setting the title, manually adjust the specific elements
                                        $('.page-title .title-area .title-text').html(`
                                            <span class="calendar-title-bold">My Calendar - </span>
                                            <span class="calendar-title-normal">${employeeNameOrID}</span>
                                        `);
                                        // Update the calendar title with the employee name/ID
                                        calendar.setOption('headerToolbar', {
                                            left: 'prev,next',
                                            center: 'title',  // Update calendar title
                                            right: 'filterButton,today'
                                        });

                                        // Refetch events with the selected employee filter
                                    calendar.setOption('events', function(fetchInfo, successCallback, failureCallback) {
                                        frappe.call({
                                            method: "hr_plus.hr_plus.page.my_calendar.my_calendar.get_calendar_events",
                                            args: {
                                                start_date: fetchInfo.startStr,
                                                end_date: fetchInfo.endStr,
                                                employee: employeeFilter
                                            },
                                            callback: function(r) {
                                                if (!r.exc && r.message) {
                                                    console.log(`Event filters ${employeeFilter}`);
                                                    var attendance = r.message;
                                                    var events = attendance.flatMap(function(event) {
                                                        var backgroundColor, borderColor, textColor = "black";
                                                        switch (event.status) {
                                                            case 'Holiday':
                                                                backgroundColor = '#bea8f2';  // Holiday color
                                                                borderColor = backgroundColor;
                                                                break;
                                                                    
                                                            case 'Present':
                                                                backgroundColor = '#D5ECC2';
                                                                borderColor = backgroundColor;
                                                                break;
                                                            case 'Half Day':
                                                                backgroundColor = '#FFD3B4';
                                                                borderColor = backgroundColor;
                                                                break;
                                                            case 'Absent':
                                                                backgroundColor = '#FFAAA7';
                                                                borderColor = backgroundColor;
                                                                break;
                                                            case 'On Leave':
                                                                backgroundColor = '#98DDCA ';
                                                                borderColor = backgroundColor;
                                                                break;
                                                            case 'Work From Home':
                                                                backgroundColor = '#EABF9F';
                                                                borderColor = backgroundColor;
                                                                break;
                                                            default:
                                                                backgroundColor = 'red';
                                                                borderColor = backgroundColor;
                                                        }

                                                        var inTime, outTime, durationString;
                                                        if (event.in_time || event.out_time) {
                                                            
                                                            // Handle case where only in_time or out_time is missing
                                                            inTime = event.in_time ? new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                                            outTime = event.out_time ? new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                                            
                                                            durationString = inTime + " to " + outTime;
                                                        }

                                                        // Create the events list in the desired order
                                                        var eventList = [
                                                            {
                                                                title: '1. ' + event.status,
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, employee: event.employee }
                                                            }
                                                        ];
                                                        
                                                         // Add the holiday event to the eventList if public_holiday_ is available
                                                        
                                                        if (event.public_holiday_) {  // If public_holiday_ is not empty or None
                                                            eventList.push({
                                                                title:  '2. '+ event.public_holiday_,  // Show the holiday name
                                                                start: event.attendance_date,  // Use holiday_date for holidays
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                                            });
                                                        }
                                                        
                                                        // Conditionally add FPC
                                                        if (event.attendance_request) {
                                                            eventList.push({
                                                                title: '3.FPC: ' + event.attendance_request,
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: "#395144",
                                                                textColor: textColor,
                                                                extendedProps: {name: event.name, status: event.status, reason: event.reason, employee: event.employee }
                                                            });
                                                        }

                                                        // Conditionally add Time event
                                                        if (durationString) {
                                                            eventList.push({
                                                                title: '2. Time: ' + durationString,
                                                                start: event.attendance_date,
                                                                end: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                                            });
                                                        }

                                                        // Conditionally add Late Entry
                                                        if (event.late_entry) {
                                                            eventList.push({
                                                                title: '4. Late Entry',
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                                            });
                                                        }

                                                        // Conditionally add Early Exit
                                                        if (event.early_exit) {
                                                            eventList.push({
                                                                title: '5. Early Exit',
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                                            });
                                                        }
                                                        if (event.leave_type) {
                                                            eventList.push({
                                                                title: '2. Type: ' + event.leave_type,
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                                            });
                                                        }

                                                        return eventList;
                                                    });
                                                    console.log(events);
                                                    successCallback(events);
                                                } else {
                                                    failureCallback();
                                                }
                                            }
                                        });
                                    });

                                        calendar.refetchEvents();
                                    });
                                }, 'Filter Events', 'Filter');
                                /////////////////////////////////
                            }
                        }
                    },
                    // Highlight Fridays
                    
                    dayCellClassNames: function(arg) {
                        var classes = [];
                        // Check if the day is Friday (5 is Friday in JavaScript)
                        if (arg.date.getDay() === 5) {
                            classes.push('friday-highlight');

                        }
                        return classes;
                    },
                    
                  
                    events: function(fetchInfo, successCallback, failureCallback) {
                        console.log(fetchInfo.startStr);
                        console.log(fetchInfo.endStr);
                        var employeeFilter = ''; // Default to empty string for initial load
                        frappe.call({
                            method: "hr_plus.hr_plus.page.my_calendar.my_calendar.get_calendar_events",
                            args: {
                                start_date: fetchInfo.startStr,
                                end_date: fetchInfo.endStr,
                                employee: employeeFilter
                            },
                            callback: function(r) {
                                if (!r.exc && r.message) {
                                    console.log(`Event filters ${employeeFilter}`);
                                    var attendance = r.message;
                                    var events = attendance.flatMap(function(event) {
                                        var backgroundColor, borderColor, textColor = "black";
                                        switch (event.status) {
                                            case 'Holiday':
                                                backgroundColor = '#bea8f2';  // Holiday color
                                                borderColor = backgroundColor;
                                                break;
                                            case 'Present':
                                                backgroundColor = '#D5ECC2';
                                                borderColor = backgroundColor;
                                                break;
                                            case 'Half Day':
                                                backgroundColor = '#FFD3B4';
                                                borderColor = backgroundColor;
                                                break;
                                            case 'Absent':
                                                backgroundColor = '#FFAAA7';
                                                borderColor = backgroundColor;
                                                break;
                                            case 'On Leave':
                                                backgroundColor = '#98DDCA ';
                                                borderColor = backgroundColor;
                                                break;
                                            case 'Work From Home':
                                                backgroundColor = '#EABF9F';
                                                borderColor = backgroundColor;
                                                break;
                                            default:
                                                backgroundColor = 'red';
                                                borderColor = backgroundColor;
                                        }

                                        var inTime, outTime, durationString;
                                        if (event.in_time || event.out_time) {
                                                            
                                            // Handle case where only in_time or out_time is missing
                                            inTime = event.in_time ? new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                            outTime = event.out_time ? new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                            
                                            durationString = inTime + " to " + outTime;
                                        }

                                        // Create the events list in the desired order
                                        var eventList = [
                                            {
                                                title: '1. ' + event.status,
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: {  name: event.name,employee: event.employee }
                                            }
                                        ];
                                         // Add the holiday event to the eventList if public_holiday_ is available
                                                        
                                         if (event.public_holiday_) {  // If public_holiday_ is not empty or None
                                            eventList.push({
                                                title: '2. '+ event.public_holiday_,  // Show the holiday name
                                                start: event.attendance_date,  // Use holiday_date for holidays
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: {  name: event.name,status: event.status, employee: event.employee }
                                            });
                                        }
                                        
                                        // Conditionally add FPC
                                        if (event.attendance_request) {
                                            eventList.push({
                                                title: '3.FPC: ' + event.attendance_request,
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: "#395144",
                                                textColor: textColor,
                                                extendedProps: { name: event.name, status: event.status, reason: event.reason, employee: event.employee }
                                            });
                                        }

                                        // Conditionally add Time event
                                        if (durationString) {
                                            eventList.push({
                                                title: '2. Time: ' + durationString,
                                                start: event.attendance_date,
                                                end: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                            });
                                        }

                                        // Conditionally add Late Entry
                                        if (event.late_entry) {
                                            eventList.push({
                                                title: '4. Late Entry',
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: {  name: event.name,status: event.status, employee: event.employee }
                                            });
                                        }

                                        // Conditionally add Early Exit
                                        if (event.early_exit) {
                                            eventList.push({
                                                title: '5. Early Exit',
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: {  name: event.name,status: event.status, employee: event.employee }
                                            });
                                        }
                                        if (event.leave_type) {
                                            eventList.push({
                                                title: '2. Type: ' + event.leave_type,
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: { name: event.name, status: event.status, employee: event.employee }
                                            });
                                        }

                                        return eventList;
                                    });
                                    console.log(events);
                                    successCallback(events);
                                } else {
                                    failureCallback();
                                }
                            }
                        });
                    },
                    eventDidMount: function(info) {
                        if (info.event.extendedProps.status) {
                            info.el.style.backgroundColor = 'white';
                        }

                        // Change color of dot marker
                        var dotEl = info.el.getElementsByClassName('fc-event-dot')[0];
                        if (dotEl) {
                            dotEl.style.backgroundColor = 'white';
                        }
                        // Initialize popover for attendance_request event
                        if (info.event.title.startsWith('3.FPC: ')) {
                            $(info.el).popover({
                                title: info.event.title,
                                content: info.event.extendedProps.reason,
                                trigger: 'hover',
                                placement: 'top',
                                container: 'body'
                            });
                        }
                    },
                    eventClick: function(info) {
                        // Toggle popover on event click
                        if (info.event.title.startsWith('3.FPC: ')) {
                            $(info.el).popover('toggle');
                        }
                        

                            var event = info.event;
                            
                            // If the event has a document name, navigate to the Attendance document
                            if (event.extendedProps && event.extendedProps.name) {
                                frappe.set_route('Form', 'Attendance', event.extendedProps.name);
                            } 
                        
                            // Prevent the default browser action
                            info.jsEvent.preventDefault();
                        
                        
                    },
                    eventDrop: function(info) {
                        frappe.call({
                            method: "hr_plus.api.move_event",
                            args: { event_id: info.event.id, delta: info.delta },
                            callback: function(r) {
                                if (!r.exc) {
                                    frappe.msgprint("Event moved successfully");
                                } else {
                                    info.revert();
                                }
                            }
                        });
                    }
                });
                //This calendar for mobile view adjustments
                if (window.innerWidth <= 768) {
                    var calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: 'dayGridMonth',
                        headerToolbar: headerToolbar,
                        height: 'auto', // Set the height to auto to fit the content
                        fixedWeekCount: false, // This ensures only the exact number of weeks in the month are shown
                        customButtons: {
                            filterButton: {
                                text: 'Filter',
                                click: function() {
                                    // Display a dialog box with filter options
frappe.prompt([
    {'fieldname': 'employee', 'fieldtype': 'Link', 'label': 'Employee', 'options': 'Employee', 'default': '', 'reqd': 0}
],
function(values) {
    var employeeFilter = values.employee;

    // Fetch the employee name or ID to update the title
    frappe.db.get_value('Employee', employeeFilter, ['employee_name', 'name'], function(r) {
        var employeeNameOrID = r.employee_name || r.name;

        // Dynamically update the page title with the selected employee
        // Set the page title with a placeholder
        page.set_title(`My Calendar - <span class="calendar-title-normal">${employeeNameOrID}</span>`);

        // After setting the title, manually adjust the specific elements
        $('.page-title .title-area .title-text').html(`
            <span class="calendar-title-bold">My Calendar - </span>
            <span class="calendar-title-normal">${employeeNameOrID}</span>
        `);
        // Update the calendar title with the employee name/ID
        calendar.setOption('headerToolbar', {
            left: 'prev,next',
            center: 'title',  // Update calendar title
            right: 'filterButton,today'
        });

        // Refetch events with the selected employee filter
        calendar.setOption('events', function(fetchInfo, successCallback, failureCallback) {
            frappe.call({
                method: "hr_plus.hr_plus.page.my_calendar.my_calendar.get_calendar_events",
                args: {
                    start_date: fetchInfo.startStr,
                    end_date: fetchInfo.endStr,
                    employee: employeeFilter
                },
                callback: function(r) {
                    if (!r.exc && r.message) {
                        console.log(`Event filters ${employeeFilter}`);
                        var attendance = r.message;
                        var events = attendance.flatMap(function(event) {
                            var backgroundColor, borderColor, textColor = "black";
                            switch (event.status) {
                                case 'Holiday':
                                    backgroundColor = '#bea8f2';  // Holiday color
                                    borderColor = backgroundColor;
                                    break;
                                case 'Present':
                                    backgroundColor = '#D5ECC2';
                                    borderColor = backgroundColor;
                                    break;
                                case 'Half Day':
                                    backgroundColor = '#FFD3B4';
                                    borderColor = backgroundColor;
                                    break;
                                case 'Absent':
                                    backgroundColor = '#FFAAA7';
                                    borderColor = backgroundColor;
                                    break;
                                case 'On Leave':
                                    backgroundColor = '#98DDCA ';
                                    borderColor = backgroundColor;
                                    break;
                                case 'Work From Home':
                                    backgroundColor = '#EABF9F';
                                    borderColor = backgroundColor;
                                    break;
                                default:
                                    backgroundColor = 'red';
                                    borderColor = backgroundColor;
                            }

                            var inTime, outTime, durationString;
                            if (event.in_time || event.out_time) {
                            
                                // Handle case where only in_time or out_time is missing
                                inTime = event.in_time ? new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                outTime = event.out_time ? new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                
                                durationString = inTime + " to " + outTime;
                            }

                            // Create the events list in the desired order
                            var eventList = [
                                {
                                    title: event.status,
                                    start: event.attendance_date,
                                    backgroundColor: backgroundColor,
                                    borderColor: borderColor,
                                    textColor: textColor,
                                    extendedProps: {  name: event.name, employee: event.employee, in_time: event.in_time, out_time: event.out_time, late_entry: event.late_entry, early_exit: event.early_exit, leave_type: event.leave_type, attendance_request: event.attendance_request, reason: event.reason }
                                }
                            ];

                            return eventList;
                        });
                        console.log(events);
                        successCallback(events);
                    } else {
                        failureCallback();
                    }
                }
            });
        });

        calendar.refetchEvents();
    });
}, 'Filter Events', 'Filter');
                                }
                            }
                        },
                        // Highlight Fridays
                    
                    dayCellClassNames: function(arg) {
                        var classes = [];
                        // Check if the day is Friday (5 is Friday in JavaScript)
                        if (arg.date.getDay() === 5) {
                            classes.push('friday-highlight');

                        }
                        return classes;
                    },
                        events: function(fetchInfo, successCallback, failureCallback) {
                            console.log(fetchInfo.startStr);
                            console.log(fetchInfo.endStr);
                            var employeeFilter = ''; // Default to empty string for initial load
                            frappe.call({
                                method: "hr_plus.hr_plus.page.my_calendar.my_calendar.get_calendar_events",
                                args: {
                                    start_date: fetchInfo.startStr,
                                    end_date: fetchInfo.endStr,
                                    employee: employeeFilter
                                },
                                callback: function(r) {
                                    if (!r.exc && r.message) {
                                        console.log(`Event filters ${employeeFilter}`);
                                        var attendance = r.message;
                                        var events = attendance.flatMap(function(event) {
                                            var backgroundColor, borderColor, textColor = "black";
                                            switch (event.status) {
                                                case 'Holiday':
                                                        backgroundColor = '#bea8f2';  // Holiday color
                                                        borderColor = backgroundColor;
                                                    break;
                                                case 'Present':
                                                    backgroundColor = '#D5ECC2';
                                                    borderColor = backgroundColor;
                                                    break;
                                                case 'Half Day':
                                                    backgroundColor = '#FFD3B4';
                                                    borderColor = backgroundColor;
                                                    break;
                                                case 'Absent':
                                                    backgroundColor = '#FFAAA7';
                                                    borderColor = backgroundColor;
                                                    break;
                                                case 'On Leave':
                                                    backgroundColor = '#98DDCA ';
                                                    borderColor = backgroundColor;
                                                    break;
                                                case 'Work From Home':
                                                    backgroundColor = '#EABF9F';
                                                    borderColor = backgroundColor;
                                                    break;
                                                default:
                                                    backgroundColor = 'red';
                                                    borderColor = backgroundColor;
                                            }
                    
                                            var inTime, outTime, durationString;
                                            if (event.in_time || event.out_time) {
                                                            
                                                // Handle case where only in_time or out_time is missing
                                                inTime = event.in_time ? new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                                outTime = event.out_time ? new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA';
                                                
                                                durationString = inTime + " to " + outTime;
                                            }
                                            // Create the events list in the desired order
                                            var eventList = [
                                                {
                                                    title: event.status,
                                                    start: event.attendance_date,
                                                    backgroundColor: backgroundColor,
                                                    borderColor: borderColor,
                                                    textColor: textColor,
                                                    extendedProps: {  name: event.name, employee: event.employee, in_time: event.in_time, out_time: event.out_time, late_entry: event.late_entry, early_exit: event.early_exit, leave_type: event.leave_type, attendance_request: event.attendance_request, reason: event.reason , holiday: event.public_holiday_}
                                                }
                                            ];
                    
                                            return eventList;
                                        });
                                        console.log(events);
                                        successCallback(events);
                                    } else {
                                        failureCallback();
                                    }
                                }
                            });
                        },
                        eventDidMount: function(info) {
                            if (info.event.extendedProps.status) {
                                info.el.style.backgroundColor = 'white';
                            }
                    
                            // Change color of dot marker
                            var dotEl = info.el.getElementsByClassName('fc-event-dot')[0];
                            if (dotEl) {
                                dotEl.style.backgroundColor = 'white';
                            }
                        },
                        eventClick: function(info) {
                            var eventDetailsCard = $('#event-details-card');
                            var event = info.event;
                        
                            // Format the date as (Sat, 19 Jan)
                            var options = { weekday: 'short', day: 'numeric', month: 'short' };
                            var formattedDate = event.start.toLocaleDateString(undefined, options);
                        
                            // Display the date in a separate card
                            var dateContent = `<div style=" border-radius: 5px; margin-bottom: 10px;">
                                                    <h4> ${formattedDate}</h4>
                                               </div>`;
                        
                            // Display the event details in another card
                            var content = '';
                            
                            if (event.title) {
                                content += `<p><strong>Status:</strong><span class="status-click" style="cursor: pointer; "> ${event.title} </span></p>`;
                            }
                            if (event.extendedProps.in_time || event.extendedProps.out_time) {

                                content += `<p><strong>Time:</strong> ${event.extendedProps.in_time ? new Date(event.extendedProps.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA'} to ${event.extendedProps.out_time ? new Date(event.extendedProps.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }):'NA'}</p>`;
                            }                                          
                            if (event.extendedProps.late_entry) {
                                content += `<p><strong>Late Entry:</strong> ${event.extendedProps.late_entry ? 'Yes' : ''}</p>`;
                            }
                            if (event.extendedProps.early_exit) {
                                content += `<p><strong>Early Exit:</strong> ${event.extendedProps.early_exit ? 'Yes' : ''}</p>`;
                            }
                            if (event.extendedProps.leave_type) {
                                content += `<p><strong>Leave Type:</strong> ${event.extendedProps.leave_type}</p>`;
                            }
                            if (event.extendedProps.reason) {
                                content += `<p><strong>Reason:</strong> ${event.extendedProps.reason}</p>`;
                            }
                            if (event.extendedProps.attendance_request) {
                                content += `<p><strong>Attendance Reques:FPC</strong> ${new Date(event.extendedProps.custom_from_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(event.extendedProps.custom_to_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>`;
                            }
                            if (event.extendedProps.holiday) {
                                content += `<p><strong>Reason:</strong> ${event.extendedProps.holiday}</p>`;
                            }
                        
                            // Combine the date and event details content
                            var combinedContent = dateContent + `<div style="background-color: ${info.el.style.backgroundColor}; padding: 10px; border-radius: 5px;">` + content + '</div>';
                        
                            eventDetailsCard.html(combinedContent).show();

                            eventDetailsCard.find('.status-click').on('click', function() {
                                if (event.extendedProps && event.extendedProps.name) {
                                    frappe.set_route('Form', 'Attendance', event.extendedProps.name);
                                }
                            });
                            // Apply hover effect using inline JavaScript
                            eventDetailsCard.find('.status-click').hover(function() {
                                $(this).css({
                                    "text-decoration": "underline",  // Add underline on hover
                                    "font-size": "15px"  // Set font size to 14px on hover
                                });
                            }, function() {
                                // Revert back when hover ends
                                $(this).css({
                                    "text-decoration": "none",
                                    "font-size": "14px"  // Keep font size 14px even after hover
                                });
                            });
                        },
                        
                        
                        eventDrop: function(info) {
                            frappe.call({
                                method: "hr_plus.api.move_event",
                                args: { event_id: info.event.id, delta: info.delta },
                                callback: function(r) {
                                    if (!r.exc) {
                                        frappe.msgprint("Event moved successfully");
                                    } else {
                                        info.revert();
                                    }
                                }
                            });
                        }
                    });
                    
                   
                    
            }

                calendar.render();

                // Adjust the calendar height on window resize
                $(window).resize(function() {
                    let calWidth = $(wrapper).width();
                    calendar.setOption('height', calWidth < 768 ? 'auto' : 500);
                });
            });
        }
    });
};
