"use client";

import { useState } from "react";
import { CalendarEvent } from "@/lib/supabase";

type Props = {
  date: string | null;
  event: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
};

const EVENT_TYPES = [
  { value: "content", label: "Content Launch", color: "#3b82f6" },
  { value: "reminder", label: "Performance Reminder", color: "#f59e0b" },
  { value: "review", label: "Program Review", color: "#10b981" },
];

export default function EventModal({ date, event, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventType, setEventType] = useState(event?.event_type || "content");
  const [eventDate, setEventDate] = useState(event?.start_date || date || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const body = {
      title,
      description: description || null,
      start_date: eventDate,
      event_type: eventType,
      color: EVENT_TYPES.find((t) => t.value === eventType)?.color || "#3b82f6",
    };

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    onSaved();
  }

  async function handleMove() {
    if (!event) return;
    setSaving(true);
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id, start_date: eventDate }),
    });
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!event) return;
    await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id }),
    });
    onSaved();
  }

  const dateChanged = event && eventDate !== event.start_date;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {event ? "Event Details" : `New Event — ${date}`}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
              placeholder="e.g. Q2 Campaign Launch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CalendarEvent["event_type"])}
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
              rows={3}
              placeholder="Notes, links, details..."
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {event && (
              <button
                onClick={handleDelete}
                className="text-red-600 text-sm hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            {event && dateChanged ? (
              <button
                onClick={handleMove}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Moving..." : "Move Event"}
              </button>
            ) : !event ? (
              <button
                onClick={handleSave}
                disabled={!title || saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
