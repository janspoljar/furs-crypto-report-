import { supabaseAdmin } from "./admin";

export async function getReportSubmissions(userId: string): Promise<Map<number, Date>> {
  const { data } = await supabaseAdmin
    .from("report_submissions")
    .select("year, marked_submitted_at")
    .eq("user_id", userId);

  const map = new Map<number, Date>();
  for (const row of data ?? []) {
    map.set(row.year as number, new Date(row.marked_submitted_at as string));
  }
  return map;
}

export async function upsertReportSubmission(userId: string, year: number): Promise<void> {
  await supabaseAdmin
    .from("report_submissions")
    .upsert(
      { user_id: userId, year, marked_submitted_at: new Date().toISOString() },
      { onConflict: "user_id,year" }
    );
}

export async function deleteReportSubmission(userId: string, year: number): Promise<void> {
  await supabaseAdmin
    .from("report_submissions")
    .delete()
    .eq("user_id", userId)
    .eq("year", year);
}
