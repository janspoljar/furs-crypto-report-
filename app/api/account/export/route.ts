import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Napaka pri izvozu podatkov: " + error.message },
      { status: 500 }
    );
  }

  const date = new Date().toISOString().split("T")[0];
  const filename = `transakcije-${date}.json`;
  const json = JSON.stringify(transactions ?? [], null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
