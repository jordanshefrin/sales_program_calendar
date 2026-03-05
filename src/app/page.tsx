"use client";

import { useState, useCallback } from "react";
import ProgramForm from "@/components/ProgramForm";
import Calendar from "@/components/Calendar";
import EventModal from "@/components/EventModal";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { CalendarEvent } from "@/lib/supabase";

export default function Home() {
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDateClick = useCallback((date: string) => {
    setModalDate(date);
    setModalEvent(null);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setModalEvent(event);
    setModalDate(null);
  }, []);

  const handleClose = useCallback(() => {
    setModalDate(null);
    setModalEvent(null);
  }, []);

  const handleSaved = useCallback(() => {
    setModalDate(null);
    setModalEvent(null);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          Sales Program Calendar
        </h1>
        <p className="text-sm text-gray-500">
          Content calendar & performance dashboard
        </p>
      </header>

      {/* Program Submission Form */}
      <div className="px-6 pt-6">
        <ProgramForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Main Layout: Calendar (left) + Dashboard (right) */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Calendar
              key={refreshKey}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </div>
          <div className="lg:col-span-2">
            <PerformanceDashboard />
          </div>
        </div>
      </main>

      {/* Event Modal */}
      {(modalDate || modalEvent) && (
        <EventModal
          date={modalDate}
          event={modalEvent}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
