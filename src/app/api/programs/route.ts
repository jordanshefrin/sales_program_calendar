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

export async function PATCH(req: NextRequest) {
  const { id, status, performance_snapshot } = await req.json();
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (performance_snapshot !== undefined) updates.performance_snapshot = performance_snapshot;

  const { error } = await getSupabase()
    .from("programs")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
