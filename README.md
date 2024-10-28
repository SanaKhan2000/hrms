# My Calendar

The `My Calendar` feature is an interactive calendar tool designed for efficient attendance and event tracking within ERPNext. It provides users with a clean, customizable view of attendance, holidays, leaves, and other work-related events. By integrating with ERPNext’s `hr plus` module, `My Calendar` enhances workforce management by offering daily, weekly, and monthly views tailored to employee schedules, with theme adaptability and mobile optimization for convenient access across devices.

This calendar supports various color-coded statuses, such as "Present," "Holiday," "On Leave," and "Work from Home," ensuring quick visual recognition of each day’s status. The tool also enables filtering by employees, interactive event details, and theme adaptation, making it ideal for HR managers and team leads seeking an organized and accessible way to track team availability.

## Features

- **Customizable View**: 
  - Display event details such as attendance status, holidays, leave types, and special events with color-coded highlights.
  - Fridays are visually distinguished for easy week planning.

- **Dynamic Theme Support**:
  - The calendar adapts to the current user theme (Light or Dark) and detects theme changes in real-time, updating without needing a page reload.

- **Employee Filter**:
  - A "Filter" button allows users to view the calendar based on specific employee records, updating the calendar title and events accordingly.

- **Mobile Optimization**:
  - Layouts, font sizes, and event styles adjust automatically to fit mobile devices, ensuring a seamless experience across different screen sizes.

- **Interactive Events**:
  - Events display detailed pop-up information on hover or click, including in-time, out-time, and custom labels like "Late Entry" or "Early Exit."
  - For events with specific actions, such as "Attendance Request," clicking the event directs users to relevant documents or workflows.

- **Event Details Card**:
  - A styled card displays date, time, and status details for selected events, enhancing readability and interaction.

## Installation

1. Ensure `FullCalendar` is loaded within your project, as this library is essential for the calendar’s functionality.
2. Import or reference the `my_calendar.js` file within your `hr plus` module.
3. Verify access to employee and attendance data to enable filtering and event display.

## Usage

- **Theme Settings**: Adjust your ERPNext theme settings to see dynamic updates based on Light or Dark themes.
- **Filtering Events**: Use the "Filter" button on the calendar toolbar to select an employee, refining the calendar display to show only relevant events.
- **Event Interaction**: Click on any event to view detailed information in the event card or to be redirected to the relevant ERPNext document.

## Screenshots

### Desktop View
![Desktop View](./path/to/Screenshot_from_2024-10-28_16-32-02.png)

### Mobile View
![Mobile View](./path/to/Screenshot_from_2024-10-28_16-36-19.png)

## Troubleshooting

- **Theme Update Issues**: If theme updates are not reflected, ensure that the theme change detection function is active.
- **Event Filtering**: Ensure employees have recorded attendance data to enable meaningful filtering results.

## Contributing

Contributions are welcome! Please follow the repository guidelines and submit a pull request for review.

## License

This project is licensed under the MIT License.
