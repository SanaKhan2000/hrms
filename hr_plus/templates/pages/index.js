document.addEventListener('DOMContentLoaded', () => {
    const datesEl = document.getElementById('dates');
    const monthYearEl = document.getElementById('month-year');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    let currentDate = new Date();

    function renderCalendar() {
        datesEl.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        fetch(`/api/calendar?month=${month + 1}&year=${year}`)
            .then(response => response.json())
            .then(data => {
                monthYearEl.textContent = `${data.current_month} ${data.current_year}`;
                data.calendar.forEach(week => {
                    week.forEach(day => {
                        const eventClass = day.status ? day.status.toLowerCase() : '';
                        datesEl.innerHTML += `<div class="date ${eventClass}">
                            <span>${day.day}</span><br>
                            ${day.status ? `${day.status}<br>${day.in_time} - ${day.out_time}` : ''}
                        </div>`;
                    });
                });
            });
    }

    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
});
