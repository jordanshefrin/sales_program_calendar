"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "@/lib/supabase";

type Props = {
  onDateClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function Calendar({ onDateClick, onEventClick }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={(info) => onDateClick(info.dateStr)}
        eventClick={(info) => {
          const evt = events.find((e) => e.id === info.event.id);
          if (evt) onEventClick(evt);
        }}
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
