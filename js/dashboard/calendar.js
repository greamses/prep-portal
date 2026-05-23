import { I } from "./icons.js";

let calendarCurrentDate = new Date();
let calendarSelectedDate = new Date();

function updateAgenda(container, events) {
  const agendaContainer = container.querySelector("#calendar-agenda-view");
  if (!agendaContainer) return;

  const selectedStr = calendarSelectedDate.toISOString().split("T")[0];
  const dayEvents = events.filter(
    (e) => new Date(e.date).toISOString().split("T")[0] === selectedStr,
  );

  if (dayEvents.length === 0) {
    agendaContainer.innerHTML = `
      <div class="db-empty" style="min-height:50px; padding:0.5rem; border:none; background:transparent;">
        No live sessions scheduled.
      </div>`;
    return;
  }

  agendaContainer.innerHTML = dayEvents
    .map(
      (e) => `
    <div class="db-agenda-card">
      <div class="db-agenda-time-pill">${e.time || "00:00"}</div>
      <div class="db-agenda-info">
        <h4 class="db-agenda-title">${e.title}</h4>
        <p class="db-agenda-instructor">${e.topic || "Math Focus"}</p>
      </div>
    </div>
  `,
    )
    .join("");
}

export function renderCalendar(container, events = []) {
  const currentYear = calendarCurrentDate.getFullYear();
  const currentMonth = calendarCurrentDate.getMonth();

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const eventsByDate = {};
  events.forEach((e) => {
    const dStr = new Date(e.date).toISOString().split("T")[0];
    if (!eventsByDate[dStr]) eventsByDate[dStr] = [];
    eventsByDate[dStr].push(e);
  });

  let daysHTML = "";

  for (let x = firstDayIndex; x > 0; x--) {
    daysHTML += `<div class="db-calendar-day day-filler">${prevLastDay - x + 1}</div>`;
  }

  for (let i = 1; i <= lastDay; i++) {
    const dayDate = new Date(currentYear, currentMonth, i);
    const dayDateStr = dayDate.toISOString().split("T")[0];
    const isSelected =
      dayDate.toDateString() === calendarSelectedDate.toDateString();
    const isToday = dayDate.toDateString() === new Date().toDateString();
    const dayEvents = eventsByDate[dayDateStr] || [];

    const selectedCls = isSelected ? "is-selected" : "";
    const todayCls = isToday ? "is-today" : "";
    const hasEventCls = dayEvents.length > 0 ? "has-events" : "";

    daysHTML += `
      <button class="db-calendar-day day-active ${selectedCls} ${todayCls} ${hasEventCls}" 
              data-date="${dayDateStr}" type="button">
        <span class="day-number">${i}</span>
      </button>`;
  }

  container.innerHTML = `
    <div class="db-calendar-component">
      <div class="db-calendar-header">
        <h3 class="db-calendar-month-year">${months[currentMonth]} ${currentYear}</h3>
        <div class="db-calendar-navs">
          <button class="db-calendar-nav-btn" data-dir="prev" type="button">${I.chevronLeft}</button>
          <button class="db-calendar-nav-btn" data-dir="next" type="button">${I.chevronRight}</button>
        </div>
      </div>
      <div class="db-calendar-weekdays">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      <div class="db-calendar-grid">
        ${daysHTML}
      </div>
      <div class="db-calendar-agenda" id="calendar-agenda-view"></div>
    </div>`;

  container.querySelectorAll(".db-calendar-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir;
      calendarCurrentDate.setMonth(
        calendarCurrentDate.getMonth() + (dir === "next" ? 1 : -1),
      );
      renderCalendar(container, events);
    });
  });

  container.querySelectorAll(".day-active").forEach((dayBtn) => {
    dayBtn.addEventListener("click", () => {
      container
        .querySelectorAll(".day-active")
        .forEach((d) => d.classList.remove("is-selected"));
      dayBtn.classList.add("is-selected");
      calendarSelectedDate = new Date(dayBtn.dataset.date);
      updateAgenda(container, events);
    });
  });

  updateAgenda(container, events);
}
