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
};

export default function PerformanceDashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setPrograms(d);
          if (d.length > 0) setSelectedProgram(d[0].name);
        }
      });
  }, []);

  // Placeholder data per program — will be replaced with real data later
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
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm text-gray-900"
        >
          {programs.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

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
          {selectedProgram || "Program"} — S2 Pipeline by Week
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
