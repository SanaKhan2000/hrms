import frappe

@frappe.whitelist()
def get_calendar_events(start_date, end_date, employee=None):
    # Get the current logged-in user
    current_user = frappe.session.user

    # Fetch the HR role from HR Plus Settings
    hr_role = frappe.db.get_value('HR Plus Settings', None, 'hr_plus_role')
    
    # Check if the user has the specified HR role
    is_hr_manager = frappe.db.exists('Has Role', {'parent': current_user, 'role': hr_role})
    
    # Prepare filters for fetching events
    filters = {'attendance_date': ['between', [start_date, end_date]]}
    
    # If the user is not an HR Manager, add the employee filter
    if not is_hr_manager:
        # Fetch the employee linked to the current logged-in user
        employee = frappe.db.get_value('Employee', {'user_id': current_user}, 'name')
        if not employee:
            return []
        filters['employee'] = employee
    else:
        # Apply the employee filter if provided and user is an HR Manager
        if employee:
            filters['employee'] = employee

    # Fetch events within the given date range, applying filters based on user role
    events = frappe.db.get_list('Attendance', 
        filters=filters,
        fields=["status", "in_time", "out_time", "attendance_date", "employee", "attendance_request", "late_entry", "early_exit", "leave_type"]
    )

    # Create a list to store the modified events with the reason field
    modified_events = []

    for event in events:
        # Initialize the reason as an empty string
        reason = ''

        if event.get('attendance_request'):
            # Fetch the reason from the Attendance Request doctype
            reason = frappe.db.get_value('Attendance Request', event['attendance_request'], 'reason')

        # Add the reason to the event dictionary
        event['reason'] = reason

        # Append the modified event to the list
        modified_events.append(event)

    return modified_events

@frappe.whitelist()
def is_hr_manager():
    current_user = frappe.session.user
    # Fetch the HR role from HR Plus Settings
    hr_role = frappe.db.get_value('HR Plus Settings', None, 'hr_plus_role')
    return frappe.db.exists('Has Role', {'parent': current_user, 'role': hr_role})
