"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Program = {
  id: string;
  name: string;
  launch_date: string | null;
  status: string;
  performance_snapshot: string | null;
  created_at: string;
};

function generateBlurb(program: Program, totalPipeline: number): string {
  const parts: string[] = [];

  // When did it start
  if (program.launch_date) {
    const launch = new Date(program.launch_date + "T00:00:00");
    const launchStr = launch.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    parts.push(`${program.name} launched on ${launchStr}.`);

    // How long has it been running
    const now = new Date();
    const diffMs = now.getTime() - launch.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      parts.push(`It is scheduled to begin in ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}.`);
    } else if (program.status === "retired") {
      parts.push(`It ran for ${diffDays} day${diffDays !== 1 ? "s" : ""} before being retired.`);
    } else {
      const weeks = Math.floor(diffDays / 7);
      if (weeks > 0) {
        parts.push(`It has been running for ${weeks} week${weeks !== 1 ? "s" : ""} (${diffDays} days).`);
      } else {
        parts.push(`It has been running for ${diffDays} day${diffDays !== 1 ? "s" : ""}.`);
      }
    }
  } else {
    parts.push(`${program.name} does not have a launch date set.`);
  }

  // Status
  if (program.status === "active") {
    parts.push("The program is currently active.");
  } else {
    parts.push("The program has been retired.");
  }

  // Pipeline performance
  if (totalPipeline > 0) {
    parts.push(`Total S2 pipeline generated so far: $${(totalPipeline / 1000).toFixed(0)}k.`);
  }

  // Performance snapshot notes
  if (program.performance_snapshot) {
    parts.push(`Notes: ${program.performance_snapshot}`);
  }

  return parts.join(" ");
}

export default function PerformanceDashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setPrograms(d);
          if (d.length > 0) setSelectedId(d[0].id);
        }
      });
  }, []);

  const selected = programs.find((p) => p.id === selectedId);

  // Placeholder data — will be replaced with real data later
  const chartData = [
    { week: "Week 1", s2_pipeline: Math.round(10000 + Math.random() * 40000) },
    { week: "Week 2", s2_pipeline: Math.round(10000 + Math.random() * 40000) },
    { week: "Week 3", s2_pipeline: Math.round(10000 + Math.random() * 40000) },
    { week: "Week 4", s2_pipeline: Math.round(10000 + Math.random() * 40000) },
  ];

  const totalPipeline = chartData.reduce((s, d) => s + d.s2_pipeline, 0);

  return (
    <div className="space-y-4">
      {/* Program Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-xs text-gray-500 mb-1">Program</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Program Summary Blurb */}
      {selected && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Program Summary
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {generateBlurb(selected, totalPipeline)}
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">S2 Pipeline</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(totalPipeline / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">MQLs</p>
          <p className="text-2xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">MQL-to-S2 Rate</p>
          <p className="text-2xl font-bold text-gray-900">—</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {selected?.name || "Program"} — S2 Pipeline by Week
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="s2_pipeline" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
