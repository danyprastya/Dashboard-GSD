import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kode_gedung = searchParams.get("kode_gedung");

    if (!kode_gedung) {
      return NextResponse.json(
        { error: "kode_gedung parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[API /api/status-bulanan] Fetching status for kode_gedung: ${kode_gedung}`);

    // Fetch all status records for this gedung using id_gedung column
    const { data, error } = await supabase
      .from("status_bulanan")
      .select("*")
      .eq("id_gedung", kode_gedung)
      .order("month", { ascending: true });

    if (error) {
      console.error("[API /api/status-bulanan] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch status data", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /api/status-bulanan] Found ${data?.length || 0} status records`);

    return NextResponse.json({
      success: true,
      data: data || [],
      kode_gedung: kode_gedung,
      total: data?.length || 0
    });

  } catch (error) {
    console.error("[API /api/status-bulanan] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, period_1_20, period_21_30 } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[API /api/status-bulanan PUT] Updating status id: ${id}`);

    // Update status record
    const { data, error } = await supabase
      .from("status_bulanan")
      .update({
        period_1_20,
        period_21_30,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("[API /api/status-bulanan PUT] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update status data", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /api/status-bulanan PUT] Successfully updated status`);

    return NextResponse.json({
      success: true,
      data: data?.[0] || null
    });

  } catch (error) {
    console.error("[API /api/status-bulanan PUT] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
