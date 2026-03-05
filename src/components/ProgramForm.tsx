"use client";

import { useState } from "react";

type Props = {
  onSubmitted: () => void;
};

function getNextTuesdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  // Move to next Tuesday
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function ProgramForm({ onSubmitted }: Props) {
  const [date, setDate] = useState("");
  const [programName, setProgramName] = useState("");
  const [accountListLink, setAccountListLink] = useState("");
  const [toolkitLink, setToolkitLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tuesdays = getNextTuesdays(12);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const name = programName || "Untitled Program";
    const descParts = [
      accountListLink && `Target Account List: ${accountListLink}`,
      toolkitLink && `Toolkit: ${toolkitLink}`,
    ].filter(Boolean);
    const description = descParts.join("\n") || null;

    const events = [
      {
        title: name,
        description,
        start_date: date || tuesdays[0],
        event_type: "content",
        color: "#3b82f6",
      },
      {
        title: `${name} Performance Check`,
        description: `Performance review for ${name}`,
        start_date: addDays(date || tuesdays[0], 7),
        event_type: "reminder",
        color: "#f59e0b",
      },
      {
        title: `${name} #2?`,
        description: `Evaluate whether to run ${name} again`,
        start_date: addDays(date || tuesdays[0], 14),
        event_type: "review",
        color: "#10b981",
      },
    ];

    // Create the program record
    await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, launch_date: date || tuesdays[0] }),
    });

    // Create calendar events
    for (const event of events) {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    }

    setProgramName("");
    setDate("");
    setAccountListLink("");
    setToolkitLink("");
    setSubmitting(false);
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow px-6 py-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Sales Program</h2>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Launch Date (Tuesday)</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
          >
            <option value="">Select a Tuesday</option>
            {tuesdays.map((d) => (
              <option key={d} value={d}>
                {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Program Name</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="e.g. Q2 Zendesk Outbound"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Target Account List</label>
          <input
            type="text"
            value={accountListLink}
            onChange={(e) => setAccountListLink(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="Paste link..."
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Toolkit</label>
          <input
            type="text"
            value={toolkitLink}
            onChange={(e) => setToolkitLink(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
            placeholder="Paste link..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? "Adding..." : "Add Program"}
        </button>
      </div>
    </form>
  );
}
