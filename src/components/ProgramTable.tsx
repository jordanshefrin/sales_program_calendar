"use client";

import { useEffect, useState, useRef } from "react";

type Program = {
  id: string;
  name: string;
  launch_date: string | null;
  status: string;
  performance_snapshot: string | null;
  created_at: string;
};

function getNextTuesdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 90); // Include past Tuesdays too
  // Find first Tuesday
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7));
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

const tuesdays = getNextTuesdays(52);

export default function ProgramTable({ refreshKey, onProgramChanged }: { refreshKey: number; onProgramChanged: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPrograms(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  async function updateField(id: string, field: string, value: string, program: Program) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

    const body: Record<string, string> = { id, [field]: value };

    if (field === "name") {
      body.old_name = program.name;
    }
    if (field === "launch_date") {
      body.old_launch_date = program.launch_date || "";
      body.old_name = program.name;
    }

    await fetch("/api/programs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (field === "name" || field === "launch_date") {
      onProgramChanged();
    }
  }

  function updateName(id: string, value: string, program: Program) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: value } : p))
    );

    if (debounceTimers.current[id + "_name"]) clearTimeout(debounceTimers.current[id + "_name"]);
    debounceTimers.current[id + "_name"] = setTimeout(() => {
      updateField(id, "name", value, program);
    }, 800);
  }

  function updateSnapshot(id: string, value: string) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, performance_snapshot: value } : p))
    );

    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(() => {
      fetch("/api/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, performance_snapshot: value }),
      });
    }, 500);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
        No programs yet. Add one using the form above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-sm font-semibold text-gray-700">All Programs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Program</th>
              <th className="px-6 py-3">Launch Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Performance Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateName(p.id, e.target.value, p)}
                    className="w-full border rounded-md px-2 py-1 text-sm font-medium text-gray-900"
                  />
                </td>
                <td className="px-6 py-3">
                  <select
                    value={p.launch_date || ""}
                    onChange={(e) => updateField(p.id, "launch_date", e.target.value, p)}
                    className="w-full border rounded-md px-2 py-1 text-sm text-gray-900"
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
                </td>
                <td className="px-6 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => updateField(p.id, "status", e.target.value, p)}
                    className={`border rounded-md px-2 py-1 text-xs font-medium ${
                      p.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                  </select>
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={p.performance_snapshot || ""}
                    onChange={(e) => updateSnapshot(p.id, e.target.value)}
                    className="w-full border rounded-md px-2 py-1 text-sm text-gray-900"
                    placeholder="Add notes..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
