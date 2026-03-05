import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { name, launch_date } = await req.json();
  const { data, error } = await getSupabase()
    .from("programs")
    .insert({ name, launch_date: launch_date || null, status: "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function PATCH(req: NextRequest) {
  const { id, status, performance_snapshot, name, launch_date, old_name, old_launch_date } = await req.json();
  const supabase = getSupabase();

  // Update the program record
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (performance_snapshot !== undefined) updates.performance_snapshot = performance_snapshot;
  if (name !== undefined) updates.name = name;
  if (launch_date !== undefined) updates.launch_date = launch_date;

  const { error } = await supabase.from("programs").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If name changed, update all related calendar events
  if (name !== undefined && old_name) {
    // Update the content launch event title
    await supabase
      .from("events")
      .update({ title: name })
      .eq("title", old_name)
      .eq("event_type", "content");

    // Update the performance check event title
    await supabase
      .from("events")
      .update({ title: `${name} Performance Check` })
      .eq("title", `${old_name} Performance Check`)
      .eq("event_type", "reminder");

    // Update the #2? review event title
    await supabase
      .from("events")
      .update({ title: `${name} #2?` })
      .eq("title", `${old_name} #2?`)
      .eq("event_type", "review");
  }

  // If launch date changed, move all related calendar events
  if (launch_date !== undefined && old_launch_date) {
    const currentName = name || old_name;

    // Move the content launch event
    await supabase
      .from("events")
      .update({ start_date: launch_date })
      .eq("title", currentName)
      .eq("event_type", "content");

    // Move the performance check (+7 days)
    await supabase
      .from("events")
      .update({ start_date: addDays(launch_date, 7) })
      .eq("title", `${currentName} Performance Check`)
      .eq("event_type", "reminder");

    // Move the #2? review (+14 days)
    await supabase
      .from("events")
      .update({ start_date: addDays(launch_date, 14) })
      .eq("title", `${currentName} #2?`)
      .eq("event_type", "review");
  }

  return NextResponse.json({ success: true });
}
