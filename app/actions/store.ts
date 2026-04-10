"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// ── Timecard ──────────────────────────────────────────────────────────────────

export async function clockIn(staffName: string, date: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("timecards")
      .select("id, clock_in")
      .eq("staff_name", staffName)
      .eq("date", date)
      .maybeSingle();

    if (existing?.clock_in) return { error: "既に出勤打刻済みです" };

    if (existing) {
      const { error } = await supabase
        .from("timecards")
        .update({ clock_in: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("timecards")
        .insert({ staff_name: staffName, date, clock_in: new Date().toISOString() });
      if (error) return { error: error.message };
    }
    revalidatePath("/store/timecard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function clockOut(timecardId: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("timecards")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", timecardId);
    if (error) return { error: error.message };
    revalidatePath("/store/timecard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function upsertTimecard(data: {
  id?: string;
  staff_name: string;
  date: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  notes: string;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("timecards").update(rest).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("timecards").insert(rest);
      if (error) return { error: error.message };
    }
    revalidatePath("/store/timecard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function deleteTimecard(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("timecards").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/store/timecard");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function upsertInventoryItem(data: {
  id?: string;
  name: string;
  category: string;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  current_quantity: number;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase
        .from("inventory_items")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("inventory_items").insert(rest);
      if (error) return { error: error.message };
    }
    revalidatePath("/store/inventory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function updateInventoryQuantity(
  id: string,
  quantity: number
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("inventory_items")
      .update({ current_quantity: quantity, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/store/inventory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function deleteInventoryItem(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/store/inventory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

// ── Daily Reports ─────────────────────────────────────────────────────────────

export async function submitDailyReport(data: {
  date: string;
  content: string;
  submitted_by: string;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("daily_reports").upsert(
      { ...data, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    );
    if (error) return { error: error.message };
    revalidatePath("/store");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

// ── Weekly Shifts ──────────────────────────────────────────────────────────────

export async function upsertWeeklyShift(data: {
  id?: string;
  period_key: string;
  day_of_week: number;
  staff_name: string;
  start_time: string;
  end_time: string;
  notes: string;
}): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabase.from("weekly_shifts").update(rest).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("weekly_shifts").insert(rest);
      if (error) return { error: error.message };
    }
    revalidatePath("/store/shift");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}

export async function deleteWeeklyShift(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("weekly_shifts").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/store/shift");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "エラーが発生しました" };
  }
}
