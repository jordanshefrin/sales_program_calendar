import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  event_type: "content" | "reminder" | "review";
  color: string;
  checklist: Record<string, boolean>;
  created_at: string;
};

export const CHECKLIST_ITEMS: Record<string, string[]> = {
  content: ["Target account list ready", "Toolkit ready", "Performance tracking ready"],
  reminder: ["Underperforming", "Overperforming"],
  review: ["Continue", "Retire"],
};
