import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const numbersParam = searchParams.get("numbers");

  if (!numbersParam) {
    return NextResponse.json({ error: "No tracking numbers provided" }, { status: 400 });
  }

  const numbers = numbersParam.split(",").map(n => n.trim()).filter(Boolean).slice(0, 10); // max 10

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("*, tracking_events(*)")
    .in("tracking_number", numbers);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shipments: data });
}
