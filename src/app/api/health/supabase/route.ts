import { NextResponse } from "next/server";

import { verifySupabaseConnection } from "@/lib/supabase/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await verifySupabaseConnection();

  return NextResponse.json(
    {
      service: "supabase",
      status: result.ok ? "ok" : "unavailable",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: result.ok ? 200 : 503,
    },
  );
}
