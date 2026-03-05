import { NextRequest, NextResponse } from "next/server";
import { getSupabase, CalendarEvent } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body: Partial<CalendarEvent> = await req.json();

  const { data, error } = await getSupabase()
    .from("events")
    .insert({
      title: body.title,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      event_type: body.event_type || "content",
      color: body.color || getColorForType(body.event_type || "content"),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, start_date } = await req.json();
  const { error } = await getSupabase()
    .from("events")
    .update({ start_date })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await getSupabase().from("events").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

function getColorForType(type: string): string {
  switch (type) {
    case "content": return "#3b82f6";
    case "reminder": return "#f59e0b";
    case "review": return "#10b981";
    default: return "#6b7280";
  }
}
