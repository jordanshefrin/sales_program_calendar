"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent, CHECKLIST_ITEMS } from "@/lib/supabase";

type Props = {
  onDateClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function Calendar({ onDateClick, onEventClick }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Global click listener for checkboxes inside calendar events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" || target.getAttribute("type") !== "checkbox") return;

      e.stopPropagation();
      e.preventDefault();

      const eventId = target.getAttribute("data-event-id");
      const item = target.getAttribute("data-item");
      if (!eventId || !item) return;

      const evt = eventsRef.current.find((ev) => ev.id === eventId);
      if (!evt) return;

      const checklist = { ...(evt.checklist || {}) };
      checklist[item] = !checklist[item];

      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, checklist } : ev))
      );

      fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, checklist }),
      });
    }

    container.addEventListener("click", handleClick, true);
    return () => container.removeEventListener("click", handleClick, true);
  }, []);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  }

  async function handleEventDrop(info: { event: { id: string; startStr: string }; revert: () => void }) {
    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: info.event.id, start_date: info.event.startStr }),
    });
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => (e.id === info.event.id ? { ...e, start_date: info.event.startStr } : e))
      );
    } else {
      info.revert();
    }
  }

  const renderEventContent = useCallback((arg: { event: { id: string; title: string } }) => {
    const evt = events.find((e) => e.id === arg.event.id);
    if (!evt) return null;
    const items = CHECKLIST_ITEMS[evt.event_type] || [];
    const checklist = evt.checklist || {};

    return (
      <div style={{ padding: "2px 4px", width: "100%" }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 1 }}>{arg.event.title}</div>
        <div className="event-checklist">
          {items.map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={!!checklist[item]}
                data-event-id={evt.id}
                data-item={item}
                readOnly
              />
              <span className={checklist[item] ? "checked-item" : ""}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }, [events]);

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow p-4 calendar-checklist">
      <style>{`
        .calendar-checklist .fc-event { cursor: grab; overflow: visible; }
        .calendar-checklist .fc-daygrid-event { white-space: normal; }
        .event-checklist { margin-top: 2px; }
        .event-checklist label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          line-height: 1.4;
          color: rgba(255,255,255,0.9);
          cursor: pointer;
        }
        .event-checklist label:hover { color: #fff; }
        .event-checklist input[type="checkbox"] {
          width: 12px;
          height: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .event-checklist .checked-item { text-decoration: line-through; opacity: 0.7; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        eventDrop={handleEventDrop}
        dateClick={(info) => onDateClick(info.dateStr)}
        eventClick={(info) => {
          if ((info.jsEvent.target as HTMLElement).closest(".event-checklist")) return;
          const evt = events.find((e) => e.id === info.event.id);
          if (evt) onEventClick(evt);
        }}
        eventContent={renderEventContent}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start_date,
          end: e.end_date || undefined,
          backgroundColor: e.color,
          borderColor: e.color,
        }))}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        height="auto"
      />
    </div>
  );
}

export { type Props as CalendarProps };
