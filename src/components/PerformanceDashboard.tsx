"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type PerformanceRow = {
  program_name: string;
  revenue: number;
  leads: number;
  conversion_rate: number;
  period: string;
};

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    );
  }

  // Aggregate by period for the bar chart
  const periods = [...new Set(data.map((d) => d.period))];
  const programs = [...new Set(data.map((d) => d.program_name))];

  const revenueByPeriod = periods.map((period) => {
    const row: Record<string, string | number> = { period };
    programs.forEach((prog) => {
      const match = data.find((d) => d.period === period && d.program_name === prog);
      row[prog] = match?.revenue || 0;
    });
    return row;
  });

  const conversionByPeriod = periods.map((period) => {
    const row: Record<string, string | number> = { period };
    programs.forEach((prog) => {
      const match = data.find((d) => d.period === period && d.program_name === prog);
      row[prog] = match?.conversion_rate || 0;
    });
    return row;
  });

  // Summary cards
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalLeads = data.reduce((s, d) => s + d.leads, 0);
  const avgConversion = data.length
    ? +(data.reduce((s, d) => s + d.conversion_rate, 0) / data.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(totalRevenue / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalLeads.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avg Conversion</p>
          <p className="text-2xl font-bold text-gray-900">{avgConversion}%</p>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Revenue by Program
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByPeriod}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {programs.map((prog, i) => (
              <Bar
                key={prog}
                dataKey={prog}
                fill={COLORS[i % COLORS.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Line Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Conversion Rate Trend
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={conversionByPeriod}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {programs.map((prog, i) => (
              <Line
                key={prog}
                type="monotone"
                dataKey={prog}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
