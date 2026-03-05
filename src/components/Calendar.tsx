"use client";

import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent, CHECKLIST_ITEMS } from "@/lib/supabase";

const PROGRAM_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
  "#14b8a6", "#ef4444", "#a855f7", "#0ea5e9", "#84cc16",
];

function getBaseProgramName(title: string): string {
  // "Fin Voice #3 Performance Check" -> "Fin Voice"
  // "Fin Voice #2?" -> "Fin Voice"
  // "Fin Voice Performance Check" -> "Fin Voice"
  // "Fin Voice" -> "Fin Voice"
  let name = title;
  name = name.replace(/ #\d+ Performance Check$/, "");
  name = name.replace(/ Performance Check$/, "");
  name = name.replace(/ #\d+\?$/, "");
  return name;
}

function parseReviewTitle(title: string): { baseName: string; version: number } | null {
  const match = title.match(/^(.+?) #(\d+)\?$/);
  if (match) return { baseName: match[1], version: parseInt(match[2]) };
  return null;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getProgramColorMap(events: CalendarEvent[]): Record<string, string> {
  const programs = [...new Set(events.map((e) => getBaseProgramName(e.title)))];
  const map: Record<string, string> = {};
  programs.forEach((name, i) => {
    map[name] = PROGRAM_COLORS[i % PROGRAM_COLORS.length];
  });
  return map;
}

type UndoAction = {
  type: "delete_events";
  eventIds: string[];
} | {
  type: "restore_events";
  events: Array<{ title: string; description: string | null; start_date: string; event_type: string; color: string }>;
} | {
  type: "move_event";
  eventId: string;
  previousDate: string;
};

type Props = {
  onDateClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function Calendar({ onDateClick, onEventClick }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const containerRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<UndoAction[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Cmd+Z undo handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        performUndo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function performUndo() {
    const action = undoStack.current.pop();
    if (!action) return;

    if (action.type === "delete_events") {
      // Undo: delete the events that were created
      for (const id of action.eventIds) {
        await fetch("/api/events", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      }
    } else if (action.type === "restore_events") {
      // Undo: recreate the events that were deleted
      for (const evt of action.events) {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evt),
        });
      }
    } else if (action.type === "move_event") {
      await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.eventId, start_date: action.previousDate }),
      });
    }

    await fetchEvents();
  }

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

      // Instantly update the DOM so user sees the change
      const checkbox = target as HTMLInputElement;
      checkbox.checked = checklist[item];
      const span = checkbox.nextElementSibling;
      if (span) {
        if (checklist[item]) {
          span.classList.add("checked-item");
        } else {
          span.classList.remove("checked-item");
        }
      }

      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, checklist } : ev))
      );

      fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, checklist }),
      });

      // Handle "Continue" on review events
      if (evt.event_type === "review" && item === "Continue") {
        handleContinueToggle(evt, checklist[item]);
      }
    }

    container.addEventListener("click", handleClick, true);
    return () => container.removeEventListener("click", handleClick, true);
  }, []);

  async function handleContinueToggle(reviewEvent: CalendarEvent, isChecked: boolean) {
    const parsed = parseReviewTitle(reviewEvent.title);
    if (!parsed) return;

    const { baseName, version } = parsed;

    if (isChecked) {
      // Create next performance check and next version review
      const perfCheckTitle = `${baseName} #${version} Performance Check`;
      const nextReviewTitle = `${baseName} #${version + 1}?`;

      const newEvents = [
        {
          title: perfCheckTitle,
          description: `Performance review for ${baseName} #${version}`,
          start_date: addDays(reviewEvent.start_date, 7),
          event_type: "reminder",
          color: "#f59e0b",
        },
        {
          title: nextReviewTitle,
          description: `Evaluate whether to run ${baseName} again`,
          start_date: addDays(reviewEvent.start_date, 14),
          event_type: "review",
          color: "#10b981",
        },
      ];

      const createdIds: string[] = [];
      for (const evt of newEvents) {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evt),
        });
        if (res.ok) {
          const data = await res.json();
          createdIds.push(data.id);
        }
      }

      undoStack.current.push({ type: "delete_events", eventIds: createdIds });
      await fetchEvents();
    } else {
      // Remove the next performance check and next version review
      const perfCheckTitle = `${baseName} #${version} Performance Check`;
      const nextReviewTitle = `${baseName} #${version + 1}?`;

      const toRemove = eventsRef.current.filter(
        (e) => e.title === perfCheckTitle || e.title === nextReviewTitle
      );

      const removedEvents = toRemove.map((e) => ({
        title: e.title,
        description: e.description,
        start_date: e.start_date,
        event_type: e.event_type,
        color: e.color,
      }));

      for (const e of toRemove) {
        await fetch("/api/events", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: e.id }),
        });
      }

      undoStack.current.push({ type: "restore_events", events: removedEvents });
      await fetchEvents();
    }
  }

  async function fetchEvents() {
    const res = await fetch("/api/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  }

  async function handleEventDrop(info: { event: { id: string; startStr: string }; revert: () => void }) {
    const evt = eventsRef.current.find((e) => e.id === info.event.id);
    const previousDate = evt?.start_date || "";

    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: info.event.id, start_date: info.event.startStr }),
    });
    if (res.ok) {
      undoStack.current.push({ type: "move_event", eventId: info.event.id, previousDate });
      setEvents((prev) =>
        prev.map((e) => (e.id === info.event.id ? { ...e, start_date: info.event.startStr } : e))
      );
    } else {
      info.revert();
    }
  }

  function renderEventContent(arg: { event: { id: string; title: string } }) {
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
  }

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
          appearance: none;
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          cursor: pointer;
          flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.7);
          border-radius: 2px;
          background: transparent;
          position: relative;
        }
        .event-checklist input[type="checkbox"]:checked {
          background: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.9);
        }
        .event-checklist input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 0px;
          width: 4px;
          height: 7px;
          border: solid rgba(0,0,0,0.7);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
        .event-checklist .checked-item { text-decoration: line-through; opacity: 0.7; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        weekends={false}
        eventDrop={handleEventDrop}
        dateClick={(info) => onDateClick(info.dateStr)}
        eventClick={(info) => {
          if ((info.jsEvent.target as HTMLElement).closest(".event-checklist")) return;
          const evt = events.find((e) => e.id === info.event.id);
          if (evt) onEventClick(evt);
        }}
        eventContent={renderEventContent}
        events={(() => {
          const colorMap = getProgramColorMap(events);
          return events.map((e) => {
            const programColor = colorMap[getBaseProgramName(e.title)] || e.color;
            return {
              id: e.id,
              title: e.title,
              start: e.start_date,
              end: e.end_date || undefined,
              backgroundColor: programColor,
              borderColor: programColor,
              extendedProps: { checklist: e.checklist || {} },
            };
          });
        })()}
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
