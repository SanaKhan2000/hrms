import frappe

@frappe.whitelist()
def get_calendar_events(start_date, end_date, employee=None):
    current_user = frappe.session.user
    hr_role = frappe.db.get_value('HR Plus Settings', None, 'hr_plus_role')
    is_hr_manager = frappe.db.exists('Has Role', {'parent': current_user, 'role': hr_role})
    
    filters = {'attendance_date': ['between', [start_date, end_date]], 'docstatus': 1}
    
    if not is_hr_manager:
        employee = frappe.db.get_value('Employee', {'user_id': current_user}, 'name')
        if not employee:
            return []
        filters['employee'] = employee
    else:
        if employee:
            filters['employee'] = employee

    # Fetch attendance events within the given date range including the document name
    events = frappe.db.get_list('Attendance', 
        filters=filters,
        fields=["name", "status", "in_time", "out_time", "attendance_date", "employee", "attendance_request", "late_entry", "early_exit", "leave_type"]
    )
    
    holiday_list = frappe.db.get_value('Employee', {'user_id': current_user}, 'holiday_list')

    if holiday_list:
        holidays = frappe.get_all('Holiday', 
            filters={'parent': holiday_list}, 
            fields=['holiday_date', 'public_holiday_']
        )

        for holiday in holidays:
            if holiday.get('public_holiday_'):
                events.append({
                    'attendance_date': holiday['holiday_date'],
                    'status': 'Holiday',
                    'public_holiday_': holiday['public_holiday_'],
                    'employee': employee,
                    'in_time': None,
                    'out_time': None,
                    'name': None  # Holidays do not have an Attendance record
                })

    modified_events = []
    for event in events:
        reason = ''
        workflow_state = ''
        if event.get('attendance_request'):
            reason = frappe.db.get_value('Attendance Request', event['attendance_request'], 'reason')
            workflow_state = frappe.db.get_value('Attendance Request', event['attendance_request'], 'workflow_state')
        
        event['reason'] = reason
        event['workflow_state'] = workflow_state

        if event.get('status') == 'Holiday':
            event['title'] = 'Holiday: ' + (event.get('public_holiday_') or '')

        modified_events.append(event)

    return modified_events

@frappe.whitelist()
def is_hr_manager():
    current_user = frappe.session.user
    # Fetch the HR role from HR Plus Settings
    hr_role = frappe.db.get_value('HR Plus Settings', None, 'hr_plus_role')
    # Fetch the user's theme preference
    desk_theme = frappe.db.get_value('User', current_user, 'desk_theme')
    is_manager = frappe.db.exists('Has Role', {'parent': current_user, 'role': hr_role})
    # Return both HR manager status and desk theme
    return {
        'is_hr_manager': is_manager,
        'desk_theme': desk_theme
    }


