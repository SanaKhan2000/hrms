frappe.pages['my-calendar'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'My Calendar',
        single_column: true
    });

    // Load FullCalendar CSS
    $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/fullcalendar@5.1.0/main.min.css'
    }).appendTo('head');

    // Add custom CSS for mobile view adjustments
       // Add custom CSS for mobile view adjustments
       var customStyles = `
       @media (max-width: 768px) {
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
               border: 1px solid #2c3e50;
               border-radius: 5px;
               background-color: #f9f9f9;
               margin-top: 10px;
           }
           .fc-event:hover {
               font-size: 11px;
               color: white !important;
               font-weight: bold;
               transform: translateY(-3px);
               box-shadow: 0 10px 20px 0 rgba(0, 0, 0, 0.3);
           }
       }

       @media (min-width: 769px) {
           #event-details-card {
               display: none !important;
           }
       }
   `;
    $('<style/>', {
        type: 'text/css',
        html: customStyles
    }).appendTo('head');

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
                                function(values){
                                    // Store the selected employee for future use
                                    var employeeFilter = values.employee;
                                    console.log(employeeFilter);

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
                                                        if (event.in_time && event.out_time) {
                                                            inTime = new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                            outTime = new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                                                extendedProps: { employee: event.employee }
                                                            }
                                                        ];

                                                        // Conditionally add FCP
                                                        if (event.attendance_request) {
                                                            eventList.push({
                                                                title: 'FCP: ' + event.attendance_request,
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: "#395144",
                                                                textColor: textColor,
                                                                extendedProps: { status: event.status, reason: event.reason, employee: event.employee }
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
                                                                extendedProps: { status: event.status, employee: event.employee }
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
                                                                extendedProps: { status: event.status, employee: event.employee }
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
                                                                extendedProps: { status: event.status, employee: event.employee }
                                                            });
                                                        }
                                                        if (event.leave_type) {
                                                            eventList.push({
                                                                title: '2.Type: ' + event.leave_type,
                                                                start: event.attendance_date,
                                                                backgroundColor: backgroundColor,
                                                                borderColor: borderColor,
                                                                textColor: textColor,
                                                                extendedProps: { status: event.status, employee: event.employee }
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
                                },
                                'Filter Events',
                                'Filter');
                            }
                        }
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
                                        if (event.in_time && event.out_time) {
                                            inTime = new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            outTime = new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                                extendedProps: { employee: event.employee }
                                            }
                                        ];

                                        // Conditionally add FCP
                                        if (event.attendance_request) {
                                            eventList.push({
                                                title: 'FCP: ' + event.attendance_request,
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: "#395144",
                                                textColor: textColor,
                                                extendedProps: { status: event.status, reason: event.reason, employee: event.employee }
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
                                                extendedProps: { status: event.status, employee: event.employee }
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
                                                extendedProps: { status: event.status, employee: event.employee }
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
                                                extendedProps: { status: event.status, employee: event.employee }
                                            });
                                        }
                                        if (event.leave_type) {
                                            eventList.push({
                                                title: '2.Type: ' + event.leave_type,
                                                start: event.attendance_date,
                                                backgroundColor: backgroundColor,
                                                borderColor: borderColor,
                                                textColor: textColor,
                                                extendedProps: { status: event.status, employee: event.employee }
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
                        if (info.event.title.startsWith('FCP: ')) {
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
                        if (info.event.title.startsWith('FCP: ')) {
                            $(info.el).popover('toggle');
                        }
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
                                    function(values){
                                        // Store the selected employee for future use
                                        var employeeFilter = values.employee;
                                        console.log(employeeFilter);
    
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
                                                            if (event.in_time && event.out_time) {
                                                                inTime = new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                                outTime = new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                                                    extendedProps: { employee: event.employee, in_time: event.in_time, out_time: event.out_time, late_entry: event.late_entry, early_exit: event.early_exit, leave_type: event.leave_type, attendance_request: event.attendance_request, reason: event.reason }
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
                                    },
                                    'Filter Events',
                                    'Filter');
                                }
                            }
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
                                            if (event.in_time && event.out_time) {
                                                inTime = new Date(event.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                outTime = new Date(event.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                                    extendedProps: { employee: event.employee, in_time: event.in_time, out_time: event.out_time, late_entry: event.late_entry, early_exit: event.early_exit, leave_type: event.leave_type, attendance_request: event.attendance_request, reason: event.reason }
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
                            // Toggle popover on event click
                            if (info.event.title.startsWith('FCP: ')) {
                                $(info.el).popover('toggle');
                            }
    
                            // Mobile view logic: Show event details in a card below the calendar
                            var eventDetailsCard = $('#event-details-card');
                            var event = info.event;
                            if (event.start) {
                            var content = `<h4><strong>Date:</strong> ${event.start.toLocaleDateString()}</h4>`;
                            }
                            
                            if (event.title) {
                                content += `<p><strong>Status:</strong> ${event.title}</p>`;
                            }
                            if (event.extendedProps.in_time && event.extendedProps.out_time) {
                                content += `<p><strong>Time:</strong> ${new Date(event.extendedProps.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(event.extendedProps.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>`;
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
    
                            // Set the card's background color to match the event's background color
                            eventDetailsCard.css('background-color', info.el.style.backgroundColor);
    
                            eventDetailsCard.html(content).show();
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
